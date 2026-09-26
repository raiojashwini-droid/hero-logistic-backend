const prisma = require('../utils/prismaClient');

const RecipientGroupController = {
  // Get all recipient groups
  async getAll(req, res) {
    try {
      const companyId = req.user?.companyId || req.headers['x-company-id'];
      
      let whereClause = {};
      if (companyId) {
        whereClause.companyId = companyId;
      }

      let groups = await prisma.recipientGroup.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      if (groups.length === 0 && companyId) {
        groups = await prisma.recipientGroup.findMany({
          orderBy: { createdAt: 'desc' }
        });
      }

      return res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      console.error('Error fetching recipient groups:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch recipient groups' }
      });
    }
  },

  // Create new recipient group
  async create(req, res) {
    try {
      const { name, count, desc, description, status } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Group Name is required' }
        });
      }

      
      const { resolveCompanyId } = require('../middlewares/tenantResolver');
      let companyId = resolveCompanyId(req);
      if (req.user?.role === 'SUPER_ADMIN' && req.body.companyId) {
        companyId = req.body.companyId;
      }
    

      if (!companyId) {
        const firstCompany = await prisma.company.findFirst({ select: { id: true } });
        companyId = firstCompany?.id;
      }

      const newGroup = await prisma.recipientGroup.create({
        data: {
          name: name.trim(),
          count: count || '0 members',
          description: desc || description || '',
          status: status || 'Active',
          companyId
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Recipient Group created successfully',
        data: newGroup
      });
    } catch (error) {
      console.error('Error creating recipient group:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to create recipient group' }
      });
    }
  },

  // Delete recipient group
  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.recipientGroup.delete({
        where: { id }
      });

      return res.status(200).json({
        success: true,
        message: 'Recipient Group deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting recipient group:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to delete recipient group' }
      });
    }
  }
};

module.exports = RecipientGroupController;
