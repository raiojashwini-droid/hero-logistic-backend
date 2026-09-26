import os

def append_docs():
    filepath = r"d:\kiaan\Hero_Logistic\Hero-Logistic-Clone\backend\src\controllers\DriverPortalController.js"
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write("""
exports.getDocuments = async (req, res, next) => {
  try {
    const driver = await resolveDriver(req);
    if (!driver) return sendError(res, { code: ERROR_CODES.UNAUTHORIZED, message: 'Driver profile not found' }, 401);
    
    // Return empty documents for now to fulfill the data cleanup rule
    return sendSuccess(res, { documents: [] });
  } catch (error) { next(error); }
};
""")
    print("Appended getDocuments successfully!")

if __name__ == "__main__":
    append_docs()
