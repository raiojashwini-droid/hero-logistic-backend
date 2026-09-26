const express = require('express');
const router = express.Router();
const PromoCodeController = require('../controllers/PromoCodeController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(PromoCodeController.getAll)
  .post(PromoCodeController.create);

router.route('/:id')
  .get(PromoCodeController.getById)
  .put(PromoCodeController.update)
  .delete(PromoCodeController.delete);

module.exports = router;
