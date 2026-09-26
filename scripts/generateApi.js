const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const controllersDir = path.join(__dirname, '..', 'src', 'controllers');
const routesDir = path.join(__dirname, '..', 'src', 'routes');

if (!fs.existsSync(controllersDir)) fs.mkdirSync(controllersDir, { recursive: true });
if (!fs.existsSync(routesDir)) fs.mkdirSync(routesDir, { recursive: true });

function parseModels() {
  const content = fs.readFileSync(schemaPath, 'utf8');
  const modelRegex = /^model\s+([A-Za-z0-9_]+)\s*\{/gm;
  const models = [];
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    models.push(match[1]);
  }
  return models;
}

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function toKebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function generateController(modelName) {
  const camelModel = toCamelCase(modelName);
  
  const content = `const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Get all ${modelName}s with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    
    // Optional: Inject tenant scope here if applicable
    // if (req.tenantId) where.tenantId = req.tenantId;

    const [data, total] = await Promise.all([
      prisma.${camelModel}.findMany({
        where, skip, take, orderBy
      }),
      prisma.${camelModel}.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single ${modelName} by ID
exports.getById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    const data = await prisma.${camelModel}.findFirst({ where });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: '${modelName} not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new ${modelName}
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    // if (req.tenantId) payload.tenantId = req.tenantId;

    const data = await prisma.${camelModel}.create({
      data: payload
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update ${modelName} with Optimistic Concurrency check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const where = { id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    // Check version if optimistic concurrency is required
    const ifMatch = req.headers['if-match'];
    if (ifMatch) {
      where.version = parseInt(ifMatch.replace(/"/g, ''), 10);
    }

    try {
      const data = await prisma.${camelModel}.update({
        where,
        data: updateData
      });
      return sendSuccess(res, data);
    } catch (e) {
      if (e.code === 'P2025') {
        if (ifMatch) {
          return sendError(res, {
            code: ERROR_CODES.RESOURCE_CONFLICT,
            message: 'Resource was updated by another user or does not exist.'
          }, HTTP_STATUS.CONFLICT);
        }
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: '${modelName} not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
};

// Delete ${modelName}
exports.delete = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    await prisma.${camelModel}.delete({ where });
    
    // 204 No Content for successful delete
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: '${modelName} not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
`;

  const filepath = path.join(controllersDir, `${modelName}Controller.js`);
  fs.writeFileSync(filepath, content);
}

function generateRoute(modelName) {
  const kebabModel = toKebabCase(modelName);
  const controllerName = `${modelName}Controller`;
  
  const content = `const express = require('express');
const router = express.Router();
const ${controllerName} = require('../controllers/${controllerName}');
// const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
// router.use(auth.verifyToken);

router.route('/')
  .get(${controllerName}.getAll)
  .post(${controllerName}.create);

router.route('/:id')
  .get(${controllerName}.getById)
  .put(${controllerName}.update)
  .delete(${controllerName}.delete);

module.exports = router;
`;

  const filepath = path.join(routesDir, `${modelName}Routes.js`);
  fs.writeFileSync(filepath, content);
}

function generateIndexRoute(models) {
  let imports = '';
  let mounts = '';
  
  models.forEach(model => {
    const kebabModel = toKebabCase(model);
    imports += `const ${model}Routes = require('./${model}Routes');\n`;
    mounts += `router.use('/${kebabModel}s', ${model}Routes);\n`;
  });
  
  const content = `const express = require('express');
const router = express.Router();

${imports}

${mounts}
module.exports = router;
`;

  const filepath = path.join(routesDir, 'index.js');
  fs.writeFileSync(filepath, content);
}

function main() {
  const models = parseModels();
  console.log(`Found ${models.length} models. Upgrading API files...`);
  
  models.forEach(model => {
    generateController(model);
    generateRoute(model);
  });
  
  generateIndexRoute(models);
  
  console.log('Successfully upgraded controllers and routes!');
}

main();
