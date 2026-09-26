const { DEFAULT_PAGINATION } = require('../config/constants');

/**
 * Builds standard Prisma query options (where, skip, take, orderBy) from Express request query string.
 */
exports.buildPrismaQuery = (query) => {
  const { page, pageSize, sort, filter, limit } = query;

  // 1. Pagination — support both ?pageSize=N and ?limit=N (common REST convention)
  const rawSize = pageSize || limit;
  let take = parseInt(rawSize, 10) || DEFAULT_PAGINATION.PAGE_SIZE;
  if (take > DEFAULT_PAGINATION.MAX_PAGE_SIZE) {
    take = DEFAULT_PAGINATION.MAX_PAGE_SIZE;
  }
  const currentPage = parseInt(page, 10) || DEFAULT_PAGINATION.PAGE;
  const skip = (currentPage - 1) * take;

  // 2. Sorting
  let orderBy = [];
  if (sort) {
    const sortFields = sort.split(',');
    orderBy = sortFields.map((field) => {
      if (field.startsWith('-')) {
        return { [field.substring(1)]: 'desc' };
      }
      return { [field]: 'asc' };
    });
  } else {
    // Default sort
    orderBy = [{ createdAt: 'desc' }];
  }

  // 3. Filtering — strip all pagination/meta keys so they don't leak into Prisma where clause
  const where = {};
  const reservedKeys = ['page', 'pageSize', 'limit', 'offset', 'take', 'skip', 'sort', 'filter'];

  // Handle direct query keys like ?role=SALES
  for (const [key, value] of Object.entries(query)) {
    if (!reservedKeys.includes(key) && value !== undefined && value !== '') {
      where[key] = value;
    }
  }

  // Handle nested filter object like ?filter[role]=SALES
  if (filter && typeof filter === 'object') {
    for (const [key, value] of Object.entries(filter)) {
      if (value) {
        where[key] = value;
      }
    }
  }

  return {
    where,
    skip,
    take,
    orderBy,
    currentPage,
    pageSize: take
  };
};

/**
 * Generates the standard pagination metadata object
 */
exports.buildPaginationMeta = (total, currentPage, pageSize, sort) => {
  return {
    page: currentPage,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    sort: sort || '-createdAt'
  };
};
