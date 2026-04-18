const express = require('express');
const router = express.Router();
const { getChain, verifyIntegrity } = require('../controllers/custodiaController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:evidenciaId', verifyToken, getChain);
router.post('/verify', verifyToken, verifyIntegrity);

module.exports = router;