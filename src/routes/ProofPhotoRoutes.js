const express = require('express');
const router = express.Router();
const ProofPhotoController = require('../controllers/ProofPhotoController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(ProofPhotoController.getAll)
  .post(ProofPhotoController.create);

router.route('/:id')
  .get(ProofPhotoController.getById)
  .put(ProofPhotoController.update)
  .delete(ProofPhotoController.delete);

module.exports = router;
