const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Get all Regional Terminals with filtering and sorting
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);

    const [data, total] = await Promise.all([
      prisma.regionalTerminal.findMany({
        where,
        skip,
        take,
        orderBy: orderBy.length ? orderBy : [{ createdAt: 'asc' }]
      }),
      prisma.regionalTerminal.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single Regional Terminal by ID
exports.getById = async (req, res, next) => {
  try {
    const data = await prisma.regionalTerminal.findUnique({
      where: { id: req.params.id }
    });

    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Regional Terminal not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new Regional Terminal
exports.create = async (req, res, next) => {
  try {
    const data = await prisma.regionalTerminal.create({
      data: req.body
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Regional Terminal
exports.update = async (req, res, next) => {
  try {
    const data = await prisma.regionalTerminal.update({
      where: { id: req.params.id },
      data: req.body
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete Regional Terminal
exports.delete = async (req, res, next) => {
  try {
    await prisma.regionalTerminal.delete({
      where: { id: req.params.id }
    });
    return sendSuccess(res, { message: 'Regional Terminal deleted successfully' });
  } catch (error) {
    next(error);
  }
};
