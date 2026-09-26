const prisma = require('../utils/prismaClient');
const { resolveCompanyId } = require('../middlewares/tenantResolver');

const NotificationRuleController = {
  // Get all notification rules — strictly scoped to tenant
  async getAll(req, res) {
    try {
      const companyId = resolveCompanyId(req);

      if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(200).json({ success: true, data: [] });
      }

      const whereClause = {};
      if (req.user?.role !== 'SUPER_ADMIN') {
        whereClause.companyId = companyId;
      } else if (req.query.companyId) {
        whereClause.companyId = req.query.companyId;
      } else if (companyId) {
        whereClause.companyId = companyId;
      }

      // NOTE: No fallback to all-company fetch — that would be a data breach
      const rules = await prisma.notificationRule.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('Error fetching notification rules:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch notification rules' }
      });
    }
  },

  // Create new notification rule — scoped to tenant
  async create(req, res) {
    try {
      const { name, trigger, channels, rec, recipient, priority, status } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Rule Name is required' }
        });
      }

      let companyId = resolveCompanyId(req);
      if (req.user?.role === 'SUPER_ADMIN' && req.body.companyId) {
        companyId = req.body.companyId;
      }

      if (!companyId) {
        return res.status(403).json({
          success: false,
          error: { message: 'Company context required to create a notification rule.' }
        });
      }

      const newRule = await prisma.notificationRule.create({
        data: {
          name: name.trim(),
          trigger: trigger || 'When Load status changes to DELIVERED',
          channels: channels || 'SMS + Email',
          recipient: rec || recipient || 'Customer & Accounts',
          priority: priority || 'High',
          status: status || 'Enabled',
          companyId
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Notification Trigger Rule activated successfully',
        data: newRule
      });
    } catch (error) {
      console.error('Error creating notification rule:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to create notification rule' }
      });
    }
  },

  // Delete notification rule — with tenant ownership check
  async delete(req, res) {
    try {
      const { id } = req.params;
      const companyId = resolveCompanyId(req);

      const findWhere = { id };
      if (req.user?.role !== 'SUPER_ADMIN') {
        if (!companyId) {
          return res.status(204).send();
        }
        findWhere.companyId = companyId;
      }

      const existing = await prisma.notificationRule.findFirst({ where: findWhere });
      if (!existing) {
        return res.status(204).send();
      }

      await prisma.notificationRule.delete({ where: { id: existing.id } });

      return res.status(200).json({
        success: true,
        message: 'Notification Rule deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification rule:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to delete notification rule' }
      });
    }
  }
};

module.exports = NotificationRuleController;
