const prisma = require('../utils/prismaClient');
const { ERROR_CODES } = require('../config/constants');

class LoadService {
  /**
   * Activate a load
   * @param {string} loadId - The ID of the load
   * @param {object} assignment - Optional driver/vehicle assignments { driverId, vehicleId, trailerId }
   * @param {string} tenantId - Tenant ID for isolation
   */
  async activateLoad(loadId, assignment = {}, tenantId) {
    // 1. Fetch the load and ensure it exists and is in a valid state
    const where = { id: loadId };
    if (tenantId) where.tenantId = tenantId;

    const load = await prisma.load.findFirst({ where });

    if (!load) {
      throw { code: ERROR_CODES.NOT_FOUND, message: 'Load not found' };
    }

    if (load.status !== 'DRAFT' && load.status !== 'PENDING') {
      throw {
        code: 'LOAD_ACTIVATION_FAILED',
        message: 'Load must be in DRAFT or PENDING state to be activated',
        details: { currentStatus: load.status }
      };
    }

    // 2. Perform validations on assignments (e.g., driver compliance)
    const violations = [];

    if (assignment.driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: assignment.driverId } });
      if (!driver) {
        violations.push({ code: 'DRIVER_NOT_FOUND', entityId: assignment.driverId, message: 'Driver not found' });
      } else if (driver.status !== 'ACTIVE') {
        violations.push({ code: 'DRIVER_NOT_ACTIVE', entityId: assignment.driverId, message: 'Driver is not active' });
      }
    }

    if (assignment.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: assignment.vehicleId } });
      if (!vehicle) {
        violations.push({ code: 'VEHICLE_NOT_FOUND', entityId: assignment.vehicleId, message: 'Vehicle not found' });
      } else if (vehicle.status !== 'ACTIVE') {
        violations.push({ code: 'VEHICLE_NOT_ACTIVE', entityId: assignment.vehicleId, message: 'Vehicle is not active' });
      }
    }

    if (violations.length > 0) {
      throw {
        code: 'LOAD_ACTIVATION_FAILED',
        message: 'The load cannot be activated.',
        details: { violations }
      };
    }

    // 3. Transactionally activate load and apply assignments
    return await prisma.$transaction(async (tx) => {
      // Update the Load
      const updatedLoad = await tx.load.update({
        where: { id: loadId },
        data: {
          status: 'ACTIVE',
          driverId: assignment.driverId || load.driverId,
          vehicleId: assignment.vehicleId || load.vehicleId,
          trailerId: assignment.trailerId || load.trailerId,
          version: { increment: 1 } // Optimistic concurrency bump
        }
      });

      // Create Notification if driver is assigned
      const newDriverId = assignment.driverId || load.driverId;
      if (newDriverId && newDriverId !== load.driverId) {
        await tx.notification.create({
          data: {
            driverId: newDriverId,
            type: 'DISPATCH',
            title: 'New Load Assigned',
            message: `Load ${updatedLoad.loadNumber || updatedLoad.id} has been assigned to you.`,
            priority: 'HIGH'
          }
        });
      }

      return updatedLoad;
    });
  }

  /**
   * Update Load Status
   */
  async updateStatus(loadId, newStatus, reason, tenantId) {
    const where = { id: loadId };
    if (tenantId) where.tenantId = tenantId;

    const load = await prisma.load.findFirst({ where });
    if (!load) throw { code: ERROR_CODES.NOT_FOUND, message: 'Load not found' };

    return await prisma.$transaction(async (tx) => {
      const updatedLoad = await tx.load.update({
        where: { id: loadId },
        data: {
          status: newStatus,
          version: { increment: 1 }
        }
      });

      return updatedLoad;
    });
  }

  /**
   * Assign resources to a load
   */
  async assignResources(loadId, assignment, tenantId) {
    const where = { id: loadId };
    if (tenantId) where.tenantId = tenantId;

    const load = await prisma.load.findFirst({ where });
    if (!load) throw { code: ERROR_CODES.NOT_FOUND, message: 'Load not found' };

    const updatedLoad = await prisma.load.update({
      where: { id: loadId },
      data: {
        driverId: assignment.driverId || load.driverId,
        vehicleId: assignment.vehicleId || load.vehicleId,
        trailerId: assignment.trailerId || load.trailerId,
        version: { increment: 1 }
      }
    });

    // Calculate dynamic driver pay & notify driver if newly assigned
    const newDriverId = assignment.driverId || load.driverId;
    if (newDriverId) {
      try {
        const { calculateDriverPayForLoad } = require('../utils/driverPayCalculator');
        const assignedDriver = await prisma.driver.findUnique({ where: { id: newDriverId } });
        if (assignedDriver) {
          const calc = calculateDriverPayForLoad({ driver: assignedDriver, load });
          if (calc && calc.grossPay > 0 && (!updatedLoad.notes || !updatedLoad.notes.includes('[DRIVER_PAY:'))) {
            const updatedNotes = `${updatedLoad.notes || ''} [DRIVER_PAY:${calc.grossPay}]`.trim();
            await prisma.load.update({ where: { id: loadId }, data: { notes: updatedNotes } }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Error calculating driver pay in LoadService:', err?.message);
      }

      if (newDriverId !== load.driverId) {
        await prisma.notification.create({
          data: {
            driverId: newDriverId,
            type: 'DISPATCH',
            title: 'New Load Assigned',
            message: `Load ${updatedLoad.loadNumber || updatedLoad.id} has been assigned to you.`,
            priority: 'HIGH'
          }
        }).catch(() => {});
      }
    }

    return updatedLoad;
  }
}

module.exports = new LoadService();
