const prisma = require('../utils/prismaClient');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE_PATH = path.join(__dirname, '../data/sales_settings.json');

// Map raw LeadStage enum to readable display title
const STAGE_DISPLAY_MAP = {
  'NEW_LEAD': 'New Lead',
  'CONTACTED': 'Contacted',
  'DEMO_BOOKED': 'Demo Booked',
  'DEMO_COMPLETED': 'Demo Completed',
  'TRIAL_STARTED': 'Trial Started',
  'PROPOSAL_SENT': 'Proposal Sent',
  'NEGOTIATING': 'Negotiation',
  'WON': 'Won',
  'LOST': 'Lost'
};

const FIXED_STAGES = [
  'New Lead', 'Contacted', 'Demo Booked', 'Demo Completed',
  'Trial Started', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'
];

// Helper to load file settings for custom additions
function getFileSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH, 'utf8'));
    }
  } catch (e) {
    console.warn('Sales settings file read notice:', e.message);
  }
  return { customStages: [], customSources: [] };
}

function saveFileSettings(data) {
  try {
    if (!fs.existsSync(path.dirname(SETTINGS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('Sales settings file write notice:', e.message);
  }
}

// 1. Get All Sales Settings (Real DB Integration)
exports.getSettings = async (req, res, next) => {
  try {
    // 1. Fetch Real Notification Templates from PostgreSQL DB
    let dbTemplates = await prisma.notificationTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // If no templates in DB, seed initial production templates in DB
    if (dbTemplates.length === 0) {
      await prisma.notificationTemplate.createMany({
        data: [
          {
            title: 'Welcome Sandbox Invite',
            channel: 'Email',
            category: 'Welcome to Hero Logistics System Trial',
            body: 'Hi {{contact_name}},\n\nYour 14-day evaluation sandbox for {{company_name}} is provisioned. Please download your platform access keys here: https://hero-telematics.com/keys.\n\nBest,\n{{rep_name}}',
            status: 'Active'
          },
          {
            title: 'Follow-Up Pricing Quote',
            channel: 'Email',
            category: 'Hero Logistics SaaS Agreement — Pricing Follow-Up',
            body: 'Hi {{contact_name}},\n\nFollowing up on the proposal we sent for {{company_name}}. Happy to schedule a quick call to walk through the pricing tiers and answer any questions.\n\nBest,\n{{rep_name}}',
            status: 'Active'
          },
          {
            title: 'Demo Confirmation',
            channel: 'Email',
            category: 'Your Hero Logistics Demo is Confirmed',
            body: 'Hi {{contact_name}},\n\nThis is a confirmation that your live product walkthrough demo for {{company_name}} is scheduled. You will receive calendar invites shortly.\n\nBest,\n{{rep_name}}',
            status: 'Active'
          }
        ]
      });
      dbTemplates = await prisma.notificationTemplate.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    // Format templates for frontend key-value dictionary
    const formattedTemplates = {};
    dbTemplates.forEach(t => {
      formattedTemplates[t.title] = {
        id: t.id,
        subject: t.category || t.title,
        body: t.body || '',
        channel: t.channel || 'Email'
      };
    });

    // 2. Fetch Unique Sources from Real Lead Rows in PostgreSQL DB
    const dbSources = await prisma.lead.findMany({
      select: { source: true },
      distinct: ['source']
    }).catch(() => []);

    const fileSettings = getFileSettings();
    const sourceSet = new Set([
      'Google Search', 'LinkedIn', 'Partner Referral', 'Cold Call',
      ...dbSources.map(s => s.source).filter(Boolean),
      ...(fileSettings.customSources || [])
    ]);
    const sources = Array.from(sourceSet);

    // 3. Resolve Pipeline Stages
    const stageSet = new Set([
      ...FIXED_STAGES,
      ...(fileSettings.customStages || [])
    ]);
    const stages = Array.from(stageSet);

    return sendSuccess(res, {
      templates: formattedTemplates,
      stages,
      sources
    });
  } catch (error) {
    next(error);
  }
};

// 2. Save / Update Email Template in PostgreSQL DB
exports.saveTemplate = async (req, res, next) => {
  try {
    const { name, subject, body } = req.body;
    if (!name || !subject || !body) {
      return sendError(res, {
        code: ERROR_CODES.BAD_REQUEST,
        message: 'Template name, subject, and body are required.'
      }, HTTP_STATUS.BAD_REQUEST);
    }

    let existing = await prisma.notificationTemplate.findFirst({
      where: { title: name }
    });

    if (existing) {
      existing = await prisma.notificationTemplate.update({
        where: { id: existing.id },
        data: {
          category: subject,
          body: body,
          updatedAt: new Date()
        }
      });
    } else {
      existing = await prisma.notificationTemplate.create({
        data: {
          title: name,
          channel: 'Email',
          category: subject,
          body: body,
          status: 'Active'
        }
      });
    }

    // Return updated templates list from DB
    const allDbTemplates = await prisma.notificationTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formattedTemplates = {};
    allDbTemplates.forEach(t => {
      formattedTemplates[t.title] = {
        id: t.id,
        subject: t.category || t.title,
        body: t.body || '',
        channel: t.channel || 'Email'
      };
    });

    return sendSuccess(res, {
      savedTemplate: existing,
      templates: formattedTemplates
    }, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// 3. Delete Template from PostgreSQL DB
exports.deleteTemplate = async (req, res, next) => {
  try {
    const { name } = req.params;
    const targetTitle = decodeURIComponent(name || '').trim();

    const existing = await prisma.notificationTemplate.findFirst({
      where: { title: targetTitle }
    });

    if (existing) {
      await prisma.notificationTemplate.delete({
        where: { id: existing.id }
      });
    }

    const allDbTemplates = await prisma.notificationTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formattedTemplates = {};
    allDbTemplates.forEach(t => {
      formattedTemplates[t.title] = {
        id: t.id,
        subject: t.category || t.title,
        body: t.body || '',
        channel: t.channel || 'Email'
      };
    });

    return sendSuccess(res, {
      templates: formattedTemplates,
      deletedTitle: targetTitle
    }, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// 4. Add Pipeline Stage
exports.addStage = async (req, res, next) => {
  try {
    const { stage } = req.body;
    const cleanStage = stage ? stage.trim() : '';

    if (!cleanStage) {
      return sendError(res, {
        code: ERROR_CODES.BAD_REQUEST,
        message: 'Stage title is required.'
      }, HTTP_STATUS.BAD_REQUEST);
    }

    const fileSettings = getFileSettings();
    if (!fileSettings.customStages) fileSettings.customStages = [];
    if (!fileSettings.customStages.includes(cleanStage) && !FIXED_STAGES.includes(cleanStage)) {
      fileSettings.customStages.push(cleanStage);
      saveFileSettings(fileSettings);
    }

    const stageSet = new Set([...FIXED_STAGES, ...fileSettings.customStages]);
    const stages = Array.from(stageSet);

    return sendSuccess(res, {
      stages,
      addedStage: cleanStage
    }, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// 5. Delete Pipeline Stage
exports.deleteStage = async (req, res, next) => {
  try {
    const { stage } = req.params;
    const targetStage = decodeURIComponent(stage || '').trim();

    if (FIXED_STAGES.includes(targetStage)) {
      return sendError(res, {
        code: ERROR_CODES.BAD_REQUEST,
        message: `Core pipeline stage "${targetStage}" cannot be deleted.`
      }, HTTP_STATUS.BAD_REQUEST);
    }

    const fileSettings = getFileSettings();
    if (fileSettings.customStages) {
      fileSettings.customStages = fileSettings.customStages.filter(s => s !== targetStage);
      saveFileSettings(fileSettings);
    }

    const stageSet = new Set([...FIXED_STAGES, ...(fileSettings.customStages || [])]);
    const stages = Array.from(stageSet);

    return sendSuccess(res, {
      stages,
      removedStage: targetStage
    }, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// 6. Add Acquisition Source
exports.addSource = async (req, res, next) => {
  try {
    const { source } = req.body;
    const cleanSource = source ? source.trim() : '';

    if (!cleanSource) {
      return sendError(res, {
        code: ERROR_CODES.BAD_REQUEST,
        message: 'Acquisition source title is required.'
      }, HTTP_STATUS.BAD_REQUEST);
    }

    const fileSettings = getFileSettings();
    if (!fileSettings.customSources) fileSettings.customSources = [];
    if (!fileSettings.customSources.includes(cleanSource)) {
      fileSettings.customSources.push(cleanSource);
      saveFileSettings(fileSettings);
    }

    const dbSources = await prisma.lead.findMany({
      select: { source: true },
      distinct: ['source']
    }).catch(() => []);

    const sourceSet = new Set([
      'Google Search', 'LinkedIn', 'Partner Referral', 'Cold Call',
      ...dbSources.map(s => s.source).filter(Boolean),
      ...fileSettings.customSources
    ]);
    const sources = Array.from(sourceSet);

    return sendSuccess(res, {
      sources,
      addedSource: cleanSource
    }, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// 7. Delete Acquisition Source
exports.deleteSource = async (req, res, next) => {
  try {
    const { source } = req.params;
    const targetSource = decodeURIComponent(source || '').trim();

    const fileSettings = getFileSettings();
    if (fileSettings.customSources) {
      fileSettings.customSources = fileSettings.customSources.filter(s => s !== targetSource);
      saveFileSettings(fileSettings);
    }

    const dbSources = await prisma.lead.findMany({
      select: { source: true },
      distinct: ['source']
    }).catch(() => []);

    const sourceSet = new Set([
      'Google Search', 'LinkedIn', 'Partner Referral', 'Cold Call',
      ...dbSources.map(s => s.source).filter(Boolean),
      ...(fileSettings.customSources || [])
    ]);
    sourceSet.delete(targetSource);

    const sources = Array.from(sourceSet);

    return sendSuccess(res, {
      sources,
      removedSource: targetSource
    }, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};
