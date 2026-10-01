/**
 * Hero Logistics — Pricing & Billing Rules Architectural Service
 * 
 * Handles:
 * 1. Customer Pricing Profiles / Rate Calculations (Per Load, Per Car/Item, Per Km, Per Pallet, Per Tonne, Per Hour, Per Day, Flat Route)
 * 2. Immutable Pricing Snapshots attached directly to Loads
 * 3. Billing Rules Triggers (POD, PO, Delivery Completion) -> Transitions Billing Status to READY_TO_INVOICE
 * 4. Permission-controlled Price Overrides with Audit Trail
 */

const prisma = require('../utils/prismaClient');

class PricingService {

  static async buildLoadPricingSnapshot({ customerId, type, items = [], stops = [], distanceKm = 0, agreedRate = null, companyId, user = null }) {
    try {
      let customer = null;
      let pricingProfiles = [];
      let billingRule = null;

      if (customerId) {
        customer = await prisma.customer.findUnique({
          where: { id: customerId }
        }).catch(() => null);

        pricingProfiles = await prisma.customerPricingProfile.findMany({
          where: { customerId, isActive: true },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
        }).catch(() => []);

        billingRule = await prisma.customerBillingRule.findFirst({
          where: { customerId }
        }).catch(() => null);
      }

      const pAddr = stops.find(s => (s.type || '').toLowerCase().includes('pick'))?.address?.toLowerCase() || '';
      const dAddr = stops.find(s => (s.type || '').toLowerCase().includes('drop'))?.address?.toLowerCase() || '';

      // Match profile
      let matchedProfile = null;
      if (pricingProfiles.length > 0) {
        matchedProfile = pricingProfiles.find(r => {
          const fromMatch = !r.origin || (pAddr && pAddr.includes(r.origin.toLowerCase()));
          const toMatch = !r.destination || (dAddr && dAddr.includes(r.destination.toLowerCase()));
          return fromMatch && toMatch;
        }) || pricingProfiles[0];
      }

      // Default calculation values
      let pricingMethod = matchedProfile?.calculationMethod || 'Per Item';
      let unitPrice = matchedProfile?.baseRate || 0;
      let itemCount = Array.isArray(items) && items.length > 0 ? items.length : 1;
      let fuelLevyPercent = matchedProfile?.fuelLevyPercent || 0;
      let baseCharge = 0;
      let rateCardName = matchedProfile?.name || (customer ? `${customer.name} Standard Rates` : 'Standard Rate Card');

      // Calculate DB-based baseCharge
      if (matchedProfile) {
         let pMethod = pricingMethod.toLowerCase();
         
         if (pMethod.includes('item') || pMethod.includes('vehicle') || pMethod.includes('car')) {
            baseCharge = itemCount * unitPrice;
         } else if (pMethod.includes('pallet')) {
            const palletCount = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
            baseCharge = palletCount * unitPrice;
         } else if (pMethod.includes('tonne')) {
            const totalWeightKg = items.reduce((sum, item) => sum + ((parseFloat(item.weight || item.grossWeight) || 0) * (parseInt(item.quantity) || 1)), 0);
            const tonnes = totalWeightKg > 0 ? totalWeightKg / 1000 : 1; // Default 1 Tonne
            baseCharge = tonnes * unitPrice;
         } else if (pMethod.includes('stop')) {
            baseCharge = Math.max(0, stops.length - 2) * unitPrice; // Charge per additional stop after pickup/drop
         } else if (pMethod.includes('km') || pMethod.includes('kilometre')) {
            const dist = distanceKm > 0 ? distanceKm : 100; // Mock distance if not provided
            baseCharge = dist * unitPrice;
         } else if (pMethod.includes('hour')) {
            baseCharge = 2 * unitPrice; // Assume 2 hours default
         } else if (pMethod.includes('day')) {
            baseCharge = 1 * unitPrice; // Assume 1 day default
         } else if (pMethod.includes('distance band')) {
            const dist = distanceKm > 0 ? distanceKm : 100;
            if (dist < 50) baseCharge = unitPrice;
            else if (dist < 150) baseCharge = unitPrice * 1.5;
            else baseCharge = unitPrice * 2.5;
         } else if (pMethod.includes('combination')) {
            const dist = distanceKm > 0 ? distanceKm : 100;
            baseCharge = unitPrice + (dist * 1.5) + (itemCount * 50); // Base + $1.5/km + $50/item
         } else {
            baseCharge = unitPrice; // Per Load / Flat Route
         }

         // Enforce Minimum Charge requirement
         if (matchedProfile.minimumCharge && baseCharge < matchedProfile.minimumCharge) {
           baseCharge = matchedProfile.minimumCharge;
         }
      }

      let isOverride = false;
      let providedRate = agreedRate !== null && agreedRate !== undefined && !isNaN(parseFloat(agreedRate)) ? parseFloat(agreedRate) : null;

      if (!matchedProfile && providedRate !== null) {
         // No DB profile matched, accept provided rate as agreed load rate
         baseCharge = providedRate;
         pricingMethod = 'Flat Route / Agreed';
         unitPrice = baseCharge;
         rateCardName = 'Agreed Rate';
      } else if (providedRate !== null && Math.abs(providedRate - (baseCharge + (baseCharge * fuelLevyPercent / 100))) > 0.01) {
         // DB profile exists, but provided rate is different -> check override permission
         const allowedRoles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'ACCOUNTS', 'MANAGER'];
         const userRole = user?.role?.toUpperCase();
         
         if (!user || (userRole && allowedRoles.includes(userRole))) {
           baseCharge = providedRate;
           pricingMethod = 'Manual Override';
           unitPrice = baseCharge;
           isOverride = true;
           rateCardName = 'Manual Override Rate';
         } else {
           console.warn(`Unauthorized price override attempt by ${user?.email || 'Unknown User'}. Falling back to DB profile rate.`);
         }
      }

      let fuelLevyAmount = Math.round((baseCharge * (fuelLevyPercent / 100)) * 100) / 100;
      
      // Calculate surcharges based on matched profile
      let surchargesTotal = 0;
      const surchargesDetail = {};
      if (matchedProfile) {
        if (matchedProfile.additionalStopCharge && stops.length > 2) {
          const s = matchedProfile.additionalStopCharge * (stops.length - 2);
          surchargesTotal += s; surchargesDetail.additionalStop = s;
        }
        if (matchedProfile.waitingTimeCharge) {
          surchargesTotal += matchedProfile.waitingTimeCharge; surchargesDetail.waitingTime = matchedProfile.waitingTimeCharge;
        }
        if (matchedProfile.storageCharge) {
          surchargesTotal += matchedProfile.storageCharge; surchargesDetail.storage = matchedProfile.storageCharge;
        }
        if (matchedProfile.tollsCharge) {
          surchargesTotal += matchedProfile.tollsCharge; surchargesDetail.tolls = matchedProfile.tollsCharge;
        }
        if (matchedProfile.dgSurcharge) {
          surchargesTotal += matchedProfile.dgSurcharge; surchargesDetail.dgSurcharge = matchedProfile.dgSurcharge;
        }
        if (matchedProfile.afterHoursSurcharge) {
          surchargesTotal += matchedProfile.afterHoursSurcharge; surchargesDetail.afterHours = matchedProfile.afterHoursSurcharge;
        }
        if (matchedProfile.redeliveryCharge) {
          surchargesTotal += matchedProfile.redeliveryCharge; surchargesDetail.redelivery = matchedProfile.redeliveryCharge;
        }
        if (matchedProfile.otherCharges) {
          surchargesTotal += matchedProfile.otherCharges; surchargesDetail.other = matchedProfile.otherCharges;
        }
      }

      // GST Calculation based on matched profile gstTreatment
      let gstTreatment = (matchedProfile?.gstTreatment || 'GST_EXCLUSIVE').toUpperCase();
      let totalExGst = 0;
      let gst = 0;
      let totalIncGst = 0;
      let gstPercent = 10;

      if (gstTreatment.includes('FREE') || gstTreatment.includes('EXEMPT')) {
        gstPercent = 0;
        totalExGst = Math.round((baseCharge + fuelLevyAmount + surchargesTotal) * 100) / 100;
        gst = 0;
        totalIncGst = totalExGst;
      } else if (gstTreatment.includes('INC') || gstTreatment.includes('INCLUSIVE')) {
        gstPercent = 10;
        totalIncGst = Math.round((baseCharge + fuelLevyAmount + surchargesTotal) * 100) / 100;
        totalExGst = Math.round((totalIncGst / 1.10) * 100) / 100;
        gst = Math.round((totalIncGst - totalExGst) * 100) / 100;
      } else {
        // Default GST Exclusive / Plus GST 10%
        gstPercent = 10;
        totalExGst = Math.round((baseCharge + fuelLevyAmount + surchargesTotal) * 100) / 100;
        gst = Math.round((totalExGst * 0.10) * 100) / 100;
        totalIncGst = Math.round((totalExGst + gst) * 100) / 100;
      }

      const snapshot = {
        rateCardId: matchedProfile?.id || null,
        rateCardName,
        version: 'V1.0',
        pricingMethod,
        unitPrice,
        quantity: itemCount,
        baseCharge,
        fuelLevyPercent,
        fuelLevyAmount,
        surchargesTotal,
        gstTreatment,
        totalExGst,
        gstPercent,
        gst,
        totalIncGst,
        snapshotDate: new Date().toISOString()
      };

      return snapshot;
    } catch (err) {
      console.warn('Error building load pricing snapshot:', err?.message);
      return {
        rateCardName: 'Fallback Rate Card',
        pricingMethod: 'Per Load',
        unitPrice: 0,
        quantity: 1,
        baseCharge: 0,
        fuelLevyPercent: 0,
        fuelLevyAmount: 0,
        totalExGst: 0,
        gstPercent: 10,
        gst: 0,
        totalIncGst: 0,
        snapshotDate: new Date().toISOString()
      };
    }
  }

  /**
   * Evaluates whether a Load satisfies Customer Billing Rules to become READY_TO_INVOICE
   */
  static async evaluateBillingStatus(loadId) {
    try {
      const load = await prisma.load.findUnique({
        where: { id: loadId },
        include: {
          customer: true,
          deliveryPods: true,
          documents: true,
          items: true
        }
      });

      if (!load) return 'NOT_READY';

      const isDelivered = ['DELIVERED', 'COMPLETED', 'FULFILLED', 'CLOSED'].includes(load.status);
      const hasPod = (load.deliveryPods && load.deliveryPods.length > 0) || (load.documents && load.documents.some(d => (d.type || '').toUpperCase().includes('POD') || (d.name || '').toUpperCase().includes('POD')));

      const billingRule = await prisma.customerBillingRule.findFirst({
        where: { customerId: load.customerId }
      }).catch(() => null);

      let isReady = false;
      let blockedReason = null;

      if (billingRule) {
        const trigger = (billingRule.invoiceTrigger || 'Delivery completed').toLowerCase();
        let triggerMet = false;

        if (trigger.includes('creation')) {
          triggerMet = true;
        } else if (trigger.includes('pod') || trigger.includes('delivery')) {
          triggerMet = isDelivered;
        } else {
          triggerMet = isDelivered;
        }

        if (!triggerMet) {
          isReady = false;
        } else {
          let conditionsMet = true;
          const reqDocs = (billingRule.requiredDocuments || '').toLowerCase();
          const reqRefs = (billingRule.requiredReferences || '').toLowerCase();

          // Check POD Requirement
          if (reqDocs.includes('pod') || reqDocs.includes('signature') || reqDocs.includes('receipt')) {
            if (!hasPod) {
              conditionsMet = false;
              blockedReason = 'MISSING_POD';
            }
          }

          // Check Weighbridge Docket
          if (reqDocs.includes('weighbridge') || reqDocs.includes('docket')) {
            const hasWeighbridge = load.documents && load.documents.some(d => (d.type || '').toUpperCase().includes('WEIGH') || (d.name || '').toUpperCase().includes('WEIGH'));
            if (!hasWeighbridge) {
              conditionsMet = false;
              blockedReason = 'MISSING_WEIGHBRIDGE';
            }
          }

          // Check Required Purchase Order / Reference
          if (reqRefs.includes('po') || reqRefs.includes('purchase order')) {
            const hasPo = load.notes?.toLowerCase().includes('po:') || load.loadRef?.toLowerCase().startsWith('po-') || (load.customerRef && load.customerRef.trim() !== '');
            if (!hasPo) {
              conditionsMet = false;
              blockedReason = 'MISSING_PO_NUMBER';
            }
          }

          // Check Approval Requirement
          if (billingRule.approvalRequired) {
            const isApproved = load.notes?.includes('[BILLING_APPROVED]') || load.billingStatus === 'APPROVED';
            if (!isApproved) {
              conditionsMet = false;
              blockedReason = 'PENDING_APPROVAL';
            }
          }

          isReady = conditionsMet;
        }
      } else {
        // Fallback default logic: must be delivered and have POD
        isReady = isDelivered && hasPod;
        if (isDelivered && !hasPod) blockedReason = 'MISSING_POD';
      }

      let newStatus = 'NOT_READY';
      if (isReady) {
        newStatus = 'READY_TO_INVOICE';
      } else if (isDelivered && blockedReason) {
        newStatus = 'BILLING_BLOCKED';
      }

      if (load.billingStatus !== newStatus && load.billingStatus !== 'INVOICED') {
        await prisma.load.update({
          where: { id: loadId },
          data: { billingStatus: newStatus }
        }).catch(() => {});
      }

      return newStatus;
    } catch (err) {
      console.warn('Error evaluating billing status:', err?.message);
      return 'NOT_READY';
    }
  }

  /**
   * Records a manual Price Override with full audit trail
   */
  static async recordPriceOverride({ loadId, originalPrice, newPrice, changedBy = 'Admin User', reason = 'Manual adjustment', companyId }) {
    try {
      const load = await prisma.load.findUnique({ where: { id: loadId } });
      if (!load) throw new Error('Load not found');

      const existingAudit = Array.isArray(load.priceOverrideAudit) ? load.priceOverrideAudit : [];
      const newAuditEntry = {
        originalPrice: parseFloat(originalPrice) || 0,
        newPrice: parseFloat(newPrice) || 0,
        changedBy,
        reason,
        timestamp: new Date().toISOString()
      };

      const updatedAudit = [newAuditEntry, ...existingAudit];

      // Update pricing snapshot with new overridden price
      let currentSnapshot = typeof load.pricingSnapshot === 'object' && load.pricingSnapshot !== null ? { ...load.pricingSnapshot } : {};
      currentSnapshot.totalExGst = parseFloat(newPrice) || 0;
      currentSnapshot.gst = Math.round((currentSnapshot.totalExGst * 0.10) * 100) / 100;
      currentSnapshot.totalIncGst = Math.round((currentSnapshot.totalExGst + currentSnapshot.gst) * 100) / 100;
      currentSnapshot.isOverridden = true;

      const updated = await prisma.load.update({
        where: { id: loadId },
        data: {
          pricingSnapshot: currentSnapshot,
          pricingStatus: 'OVERRIDE',
          priceOverrideAudit: updatedAudit
        }
      });

      return updated;
    } catch (err) {
      console.error('Error recording price override:', err);
      throw err;
    }
  }
}

module.exports = PricingService;
