const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find or create sales user
  let salesRep = await prisma.user.findFirst({
    where: { role: 'SALES' }
  });

  if (!salesRep) {
    salesRep = await prisma.user.create({
      data: {
        email: 'sales@hero.com',
        password: 'dummy_hash_or_bcrypt',
        role: 'SALES',
        name: 'Alex Wright',
        status: 'ACTIVE'
      }
    });
  }

  // Create demo plan if it doesn't exist
  let subPlan = await prisma.subscriptionPlan.findFirst();
  if (!subPlan) {
    subPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Professional',
        monthlyPrice: 2004.0,
        description: 'Professional Plan',
        trialDays: 14,
        usersLimit: 10,
        driversLimit: 20,
        vehiclesLimit: 20,
        branchesLimit: 5,
        storageLimitGB: 100,
        apiCallsLimit: 50000,
        status: 'PUBLISHED'
      }
    });
  }

  console.log('Using Sales Rep:', salesRep.name, '(', salesRep.id, ')');

  // Seed Leads
  const leadsData = [
    {
      companyName: 'Vance Refrigeration',
      contactName: 'Robert Vance',
      email: 'robert@vancerefrigeration.com',
      phone: '+1 555-0199',
      fleetSize: '12 Trucks',
      transportNiche: 'Car Carrying',
      currentSoftware: 'Spreadsheets (Excel)',
      estimatedValue: 2004.0,
      score: 85,
      stage: 'NEW_LEAD',
      source: 'Google Search',
      painPoints: 'Manual route sheets take hours',
      repId: salesRep.id
    },
    {
      companyName: 'Hudson Logistics Corp',
      contactName: 'Jane Doe',
      email: 'jane@hudsonlogistics.com',
      phone: '+1 555-0188',
      fleetSize: '25 Trucks',
      transportNiche: 'General Freight',
      currentSoftware: 'Legacy ERP',
      estimatedValue: 3500.0,
      score: 90,
      stage: 'DEMO_BOOKED',
      source: 'Referral',
      painPoints: 'Lack of real-time GPS tracking',
      repId: salesRep.id
    },
    {
      companyName: 'Apex Freight Systems',
      contactName: 'John Smith',
      email: 'john@apexfreight.com',
      phone: '+1 555-0177',
      fleetSize: '8 Trucks',
      transportNiche: 'Hazmat',
      currentSoftware: 'None (Paper)',
      estimatedValue: 1500.0,
      score: 65,
      stage: 'PROPOSAL_SENT',
      source: 'LinkedIn Outbound',
      painPoints: 'Safety compliance and checklists are difficult to manage',
      repId: salesRep.id
    },
    {
      companyName: 'Swift Cargo Express',
      contactName: 'Sarah Connor',
      email: 'sarah@swiftcargo.com',
      phone: '+1 555-0166',
      fleetSize: '5 Trucks',
      transportNiche: 'Car Carrying',
      currentSoftware: 'Spreadsheets (Excel)',
      estimatedValue: 1200.0,
      score: 75,
      stage: 'TRIAL_STARTED',
      source: 'Inbound Registration',
      painPoints: 'Driver coordination issues',
      repId: salesRep.id
    }
  ];

  for (const data of leadsData) {
    const existing = await prisma.lead.findFirst({
      where: { email: data.email }
    });

    let lead;
    if (existing) {
      lead = await prisma.lead.update({
        where: { id: existing.id },
        data
      });
    } else {
      lead = await prisma.lead.create({ data });
    }

    console.log('Seeded Lead:', lead.companyName);

    // Seed DemoBooking if stage is DEMO_BOOKED
    if (lead.stage === 'DEMO_BOOKED') {
      const demoExists = await prisma.demoBooking.findFirst({
        where: { leadId: lead.id }
      });
      if (!demoExists) {
        await prisma.demoBooking.create({
          data: {
            leadId: lead.id,
            presenterId: salesRep.id,
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
            status: 'UPCOMING',
            meetingLink: 'https://zoom.us/j/123456789',
            feedback: 'Customer is looking for driver dispatch automation.'
          }
        });
      }
    }

    // Seed Proposal if stage is PROPOSAL_SENT
    if (lead.stage === 'PROPOSAL_SENT') {
      const propExists = await prisma.proposal.findFirst({
        where: { leadId: lead.id }
      });
      if (!propExists) {
        await prisma.proposal.create({
          data: {
            proposalRef: `PROP-${Math.floor(100 + Math.random() * 900)}`,
            version: 'V1',
            leadId: lead.id,
            baseValue: lead.estimatedValue || 1500,
            discountAmount: 100,
            finalValue: (lead.estimatedValue || 1500) - 100,
            validityDays: 30,
            status: 'SENT',
            includedModules: JSON.stringify(['Real-Time GPS', 'Driver Portal'])
          }
        });
      }
    }

    // Seed FollowUpTask
    const taskExists = await prisma.followUpTask.findFirst({
      where: { leadId: lead.id }
    });
    if (!taskExists) {
      await prisma.followUpTask.create({
        data: {
          leadId: lead.id,
          repId: salesRep.id,
          type: 'Call',
          description: `Follow up with ${lead.contactName} regarding their pain points: ${lead.painPoints}`,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
          status: 'PENDING'
        }
      });
    }

    // Seed SalesActivity
    const activityExists = await prisma.salesActivity.findFirst({
      where: { leadId: lead.id }
    });
    if (!activityExists) {
      await prisma.salesActivity.create({
        data: {
          leadId: lead.id,
          title: 'Lead Created',
          description: `Inbound workspace registration processed for ${lead.companyName}`,
          performedById: salesRep.id,
          timestamp: new Date()
        }
      });
    }
  }

  console.log('Sales seed complete!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
