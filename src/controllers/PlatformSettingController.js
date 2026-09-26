const prisma = require('../utils/prismaClient');

const DEFAULT_SETTING_ID = 'global_platform_setting';

const defaultValues = {
  id: DEFAULT_SETTING_ID,
  defaultCurrency: 'USD',
  defaultLanguage: 'en',
  defaultTrialDays: 14,
  basePricePerCompany: 299.00,
  forceMfaAdmins: true,
  forceMfaTenants: false,
  passwordComplexity: 'MEDIUM',
  minPasswordLength: 8,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  stripePublishableKey: 'pk_live_************************',
  stripeWebhookSecret: 'whsec_************************',
  googleMapsApiKey: 'AIzaSy************************',
  emailService: 'sendgrid',
  emailApiKey: 'SG.************************'
};

/**
 * Get Platform Settings
 */
exports.getPlatformSettings = async (req, res) => {
  try {
    let setting = null;

    if (prisma.platformSetting) {
      setting = await prisma.platformSetting.findFirst();
      if (!setting) {
        setting = await prisma.platformSetting.create({
          data: defaultValues
        });
      }
    } else {
      // Raw MySQL fallback
      const rows = await prisma.$queryRawUnsafe('SELECT * FROM platform_setting LIMIT 1');
      if (rows && rows.length > 0) {
        setting = rows[0];
        // Convert tinyint booleans to JS boolean
        setting.forceMfaAdmins = Boolean(setting.forceMfaAdmins);
        setting.forceMfaTenants = Boolean(setting.forceMfaTenants);
      } else {
        await prisma.$executeRawUnsafe(`
          INSERT INTO platform_setting (
            id, defaultCurrency, defaultLanguage, defaultTrialDays, basePricePerCompany,
            forceMfaAdmins, forceMfaTenants, passwordComplexity, minPasswordLength,
            maxLoginAttempts, lockoutDurationMinutes, stripePublishableKey, stripeWebhookSecret,
            googleMapsApiKey, emailService, emailApiKey
          ) VALUES (
            '${DEFAULT_SETTING_ID}', '${defaultValues.defaultCurrency}', '${defaultValues.defaultLanguage}',
            ${defaultValues.defaultTrialDays}, ${defaultValues.basePricePerCompany},
            ${defaultValues.forceMfaAdmins ? 1 : 0}, ${defaultValues.forceMfaTenants ? 1 : 0},
            '${defaultValues.passwordComplexity}', ${defaultValues.minPasswordLength},
            ${defaultValues.maxLoginAttempts}, ${defaultValues.lockoutDurationMinutes},
            '${defaultValues.stripePublishableKey}', '${defaultValues.stripeWebhookSecret}',
            '${defaultValues.googleMapsApiKey}', '${defaultValues.emailService}',
            '${defaultValues.emailApiKey}'
          )
        `);
        setting = { ...defaultValues };
      }
    }

    return res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return res.status(200).json({
      success: true,
      data: defaultValues
    });
  }
};

/**
 * Update Platform Settings
 */
exports.updatePlatformSettings = async (req, res) => {
  try {
    const {
      defaultCurrency,
      defaultLanguage,
      defaultTrialDays,
      basePricePerCompany,
      forceMfaAdmins,
      forceMfaTenants,
      passwordComplexity,
      minPasswordLength,
      maxLoginAttempts,
      lockoutDurationMinutes,
      stripePublishableKey,
      stripeWebhookSecret,
      googleMapsApiKey,
      emailService,
      emailApiKey,
      sectionName
    } = req.body;

    let updatedSetting = null;

    if (prisma.platformSetting) {
      let existing = await prisma.platformSetting.findFirst();
      if (!existing) {
        existing = await prisma.platformSetting.create({ data: defaultValues });
      }

      const updateData = {};
      if (defaultCurrency !== undefined) updateData.defaultCurrency = String(defaultCurrency);
      if (defaultLanguage !== undefined) updateData.defaultLanguage = String(defaultLanguage);
      if (defaultTrialDays !== undefined) updateData.defaultTrialDays = parseInt(defaultTrialDays) || 14;
      if (basePricePerCompany !== undefined) updateData.basePricePerCompany = parseFloat(basePricePerCompany) || 299.00;

      if (forceMfaAdmins !== undefined) updateData.forceMfaAdmins = Boolean(forceMfaAdmins);
      if (forceMfaTenants !== undefined) updateData.forceMfaTenants = Boolean(forceMfaTenants);
      if (passwordComplexity !== undefined) updateData.passwordComplexity = String(passwordComplexity);
      if (minPasswordLength !== undefined) updateData.minPasswordLength = parseInt(minPasswordLength) || 8;
      if (maxLoginAttempts !== undefined) updateData.maxLoginAttempts = parseInt(maxLoginAttempts) || 5;
      if (lockoutDurationMinutes !== undefined) updateData.lockoutDurationMinutes = parseInt(lockoutDurationMinutes) || 15;

      if (stripePublishableKey !== undefined) updateData.stripePublishableKey = String(stripePublishableKey);
      if (stripeWebhookSecret !== undefined) updateData.stripeWebhookSecret = String(stripeWebhookSecret);
      if (googleMapsApiKey !== undefined) updateData.googleMapsApiKey = String(googleMapsApiKey);
      if (emailService !== undefined) updateData.emailService = String(emailService);
      if (emailApiKey !== undefined) updateData.emailApiKey = String(emailApiKey);

      updatedSetting = await prisma.platformSetting.update({
        where: { id: existing.id },
        data: updateData
      });
    } else {
      // Raw MySQL fallback
      const rows = await prisma.$queryRawUnsafe('SELECT id FROM platform_setting LIMIT 1');
      let targetId = DEFAULT_SETTING_ID;
      if (rows && rows.length > 0) {
        targetId = rows[0].id;
      } else {
        await prisma.$executeRawUnsafe(`
          INSERT INTO platform_setting (id) VALUES ('${DEFAULT_SETTING_ID}')
        `);
      }

      const updates = [];
      if (defaultCurrency !== undefined) updates.push(`defaultCurrency = '${defaultCurrency}'`);
      if (defaultLanguage !== undefined) updates.push(`defaultLanguage = '${defaultLanguage}'`);
      if (defaultTrialDays !== undefined) updates.push(`defaultTrialDays = ${parseInt(defaultTrialDays) || 14}`);
      if (basePricePerCompany !== undefined) updates.push(`basePricePerCompany = ${parseFloat(basePricePerCompany) || 299.00}`);

      if (forceMfaAdmins !== undefined) updates.push(`forceMfaAdmins = ${forceMfaAdmins ? 1 : 0}`);
      if (forceMfaTenants !== undefined) updates.push(`forceMfaTenants = ${forceMfaTenants ? 1 : 0}`);
      if (passwordComplexity !== undefined) updates.push(`passwordComplexity = '${passwordComplexity}'`);
      if (minPasswordLength !== undefined) updates.push(`minPasswordLength = ${parseInt(minPasswordLength) || 8}`);
      if (maxLoginAttempts !== undefined) updates.push(`maxLoginAttempts = ${parseInt(maxLoginAttempts) || 5}`);
      if (lockoutDurationMinutes !== undefined) updates.push(`lockoutDurationMinutes = ${parseInt(lockoutDurationMinutes) || 15}`);

      if (stripePublishableKey !== undefined) updates.push(`stripePublishableKey = '${stripePublishableKey}'`);
      if (stripeWebhookSecret !== undefined) updates.push(`stripeWebhookSecret = '${stripeWebhookSecret}'`);
      if (googleMapsApiKey !== undefined) updates.push(`googleMapsApiKey = '${googleMapsApiKey}'`);
      if (emailService !== undefined) updates.push(`emailService = '${emailService}'`);
      if (emailApiKey !== undefined) updates.push(`emailApiKey = '${emailApiKey}'`);

      if (updates.length > 0) {
        await prisma.$executeRawUnsafe(`
          UPDATE platform_setting SET ${updates.join(', ')} WHERE id = '${targetId}'
        `);
      }

      const fetchedRows = await prisma.$queryRawUnsafe(`SELECT * FROM platform_setting WHERE id = '${targetId}' LIMIT 1`);
      updatedSetting = fetchedRows[0];
      updatedSetting.forceMfaAdmins = Boolean(updatedSetting.forceMfaAdmins);
      updatedSetting.forceMfaTenants = Boolean(updatedSetting.forceMfaTenants);
    }

    const sectionLabel = sectionName ? `"${sectionName}"` : 'Platform Settings';

    return res.status(200).json({
      success: true,
      message: `SaaS configurations for ${sectionLabel} updated successfully.`,
      data: updatedSetting
    });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update platform settings.',
      error: error.message
    });
  }
};
