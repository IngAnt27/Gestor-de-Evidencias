const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/evidenciaController');
const upload = require('../middleware/upload');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/', verifyToken, upload.single('file'), ctrl.uploadEvidence);
router.get('/', verifyToken, ctrl.getAll);
router.get('/:id', verifyToken, ctrl.getById);
router.put('/:id', verifyToken, ctrl.update);
router.delete('/:id', verifyToken, isAdmin, ctrl.delete);

module.exports = router;