const prisma = require('../utils/prismaClient');

// Controller for AI Model Registry Management
const AiModelController = {
  // Get all AI models
  async getAll(req, res) {
    try {
      const companyId = req.user?.companyId || req.headers['x-company-id'];
      
      let whereClause = {};
      if (companyId) {
        whereClause.companyId = companyId;
      }

      let models = await prisma.aiModelRegistry.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      // If no models exist for this tenant, fallback to all models or return empty
      if (models.length === 0 && companyId) {
        models = await prisma.aiModelRegistry.findMany({
          orderBy: { createdAt: 'desc' }
        });
      }

      return res.status(200).json({
        success: true,
        data: models
      });
    } catch (error) {
      console.error('Error fetching AI models:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch AI models' }
      });
    }
  },

  // Create new AI model
  async create(req, res) {
    try {
      const { name, provider, version, latencySla, costRate, status } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Model Name & Identifier is required' }
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

      const newModel = await prisma.aiModelRegistry.create({
        data: {
          name: name.trim(),
          provider: provider || 'OpenAI',
          version: version || 'v1.0',
          latencySla: latencySla || '120ms',
          costRate: costRate || '$0.002 / 1k tokens',
          status: status || 'Active',
          lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          companyId
        }
      });

      return res.status(201).json({
        success: true,
        message: 'AI Model registered successfully',
        data: newModel
      });
    } catch (error) {
      console.error('Error creating AI model:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to register AI model' }
      });
    }
  },

  // Delete AI model
  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.aiModelRegistry.delete({
        where: { id }
      });

      return res.status(200).json({
        success: true,
        message: 'AI Model removed successfully'
      });
    } catch (error) {
      console.error('Error deleting AI model:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to delete AI model' }
      });
    }
  }
};

module.exports = AiModelController;
