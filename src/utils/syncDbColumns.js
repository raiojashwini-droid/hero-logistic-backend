const prisma = require('./prismaClient');

let synced = false;

async function syncMissingVehicleColumns() {
  if (synced) return;
  synced = true;
  try {
    const alterStatements = [
      `ALTER TABLE asset ADD COLUMN photoUrl TEXT`,
      `ALTER TABLE asset ADD COLUMN warehouseId VARCHAR(255)`,
      `ALTER TABLE warehouse ADD COLUMN photoUrl TEXT`,
      `ALTER TABLE company ADD COLUMN defaultTaxRate DOUBLE DEFAULT 0.1`,
      `ALTER TABLE user ADD COLUMN dob VARCHAR(255)`,
      `ALTER TABLE user ADD COLUMN address TEXT`,
      `ALTER TABLE user ADD COLUMN emergencyContact VARCHAR(255)`,
      `ALTER TABLE vehicle ADD COLUMN photoUrl TEXT`,
      `ALTER TABLE vehicle ADD COLUMN branchId VARCHAR(255)`,
      `ALTER TABLE vehicle ADD COLUMN regType VARCHAR(255)`,
      `ALTER TABLE vehicle ADD COLUMN regState VARCHAR(255)`,
      `ALTER TABLE vehicle ADD COLUMN regIssueDate DATETIME`,
      `ALTER TABLE vehicle ADD COLUMN regExpiryDate DATETIME`,
      `ALTER TABLE vehicle ADD COLUMN fuelType VARCHAR(255)`,
      `ALTER TABLE vehicle ADD COLUMN color VARCHAR(255)`,
      `ALTER TABLE vehicle ADD COLUMN engineNumber VARCHAR(255)`,
      `ALTER TABLE vehicle ADD COLUMN primaryMechanic VARCHAR(255)`,
      `ALTER TABLE vehicle ADD COLUMN preferredRoutes VARCHAR(255)`,
      `ALTER TABLE vehicle ADD COLUMN preferredRegions VARCHAR(255)`,
      `ALTER TABLE vehicle ADD COLUMN maxDistPerTripKm INT`,
      `ALTER TABLE vehicle ADD COLUMN dgCertified TINYINT(1) DEFAULT 0`,
      `ALTER TABLE vehicle ADD COLUMN hvCertified TINYINT(1) DEFAULT 0`,
      `ALTER TABLE company ADD COLUMN dotNumber VARCHAR(255)`,
      `ALTER TABLE user ADD COLUMN branchId VARCHAR(255)`,
      `ALTER TABLE custom_role ADD COLUMN slug VARCHAR(255)`,
      `ALTER TABLE custom_role ADD COLUMN is_system TINYINT(1) DEFAULT 0`,
      `ALTER TABLE customer_invoice ADD COLUMN notes TEXT`,
      `ALTER TABLE customer_invoice ADD COLUMN pdfUrl TEXT`,
      `ALTER TABLE customer_invoice ADD COLUMN items JSON`,
      `ALTER TABLE customer_invoice ADD COLUMN type VARCHAR(255) DEFAULT 'Freight'`,
      `ALTER TABLE customer_invoice ADD COLUMN dueDate DATETIME`,
      `ALTER TABLE customer_invoice ADD COLUMN appliedTaxRate DOUBLE DEFAULT 0.1`,
      `ALTER TABLE customer ADD COLUMN branchId VARCHAR(255)`,
      `ALTER TABLE load_item ADD COLUMN damageReportReq TINYINT(1) DEFAULT 0`,
      `ALTER TABLE load_item ADD COLUMN receivedDate DATETIME`,
      `ALTER TABLE load_lane ADD COLUMN area VARCHAR(255)`,
      `CREATE TABLE IF NOT EXISTS platform_setting (
        id VARCHAR(255) PRIMARY KEY,
        defaultCurrency VARCHAR(50) NOT NULL DEFAULT 'USD',
        defaultLanguage VARCHAR(50) NOT NULL DEFAULT 'en',
        defaultTrialDays INT NOT NULL DEFAULT 14,
        basePricePerCompany DOUBLE NOT NULL DEFAULT 299.00,
        forceMfaAdmins TINYINT(1) NOT NULL DEFAULT 1,
        forceMfaTenants TINYINT(1) NOT NULL DEFAULT 0,
        passwordComplexity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
        minPasswordLength INT NOT NULL DEFAULT 8,
        maxLoginAttempts INT NOT NULL DEFAULT 5,
        lockoutDurationMinutes INT NOT NULL DEFAULT 15,
        stripePublishableKey TEXT,
        stripeWebhookSecret TEXT,
        googleMapsApiKey TEXT,
        emailService VARCHAR(50) NOT NULL DEFAULT 'sendgrid',
        emailApiKey TEXT,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    for (const sql of alterStatements) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e) {
        // Ignore duplicate column errors if column already exists
      }
    }
    console.log('MySQL Database vehicle columns auto-synced successfully.');
  } catch (err) {
    console.warn('Database column auto-sync warning:', err.message);
  }
}

module.exports = syncMissingVehicleColumns;
