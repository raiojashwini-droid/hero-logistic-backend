const prisma = require('../utils/prismaClient');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

exports.getByDriverId = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    let data = await prisma.driverSuperInfo.findUnique({ where: { driverId } });
    if (!data) {
      // Default placeholder if none exists yet
      data = {
        fundName: 'AustralianSuper',
        memberNumber: 'AS-102948',
        usi: 'STA0100AU',
        rate: '11.5%',
        ytdContribution: '$0.00',
        status: 'Active & Compliant'
      };
    }
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.upsert = async (req, res, next) => {
  try {
    const { driverId, fundName, memberNumber, usi, rate, ytdContribution, status } = req.body;
    if (!driverId) return sendError(res, { code: 'VALIDATION_ERROR', message: 'driverId is required' }, 400);

    const data = await prisma.driverSuperInfo.upsert({
      where: { driverId },
      update: {
        fundName: fundName || 'AustralianSuper',
        memberNumber: memberNumber || '',
        usi: usi || '',
        ...(rate && { rate }),
        ...(ytdContribution && { ytdContribution }),
        ...(status && { status })
      },
      create: {
        driverId,
        fundName: fundName || 'AustralianSuper',
        memberNumber: memberNumber || '',
        usi: usi || '',
        rate: rate || '11.5%',
        ytdContribution: ytdContribution || '$0.00',
        status: status || 'Active & Compliant'
      }
    });

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};
