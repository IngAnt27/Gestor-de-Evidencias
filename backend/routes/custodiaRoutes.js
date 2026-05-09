const express = require('express');
const router = express.Router();
const { getChain, verifyIntegrity, generateTraceabilityPDF } = require('../controllers/custodiaController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:evidenciaId', verifyToken, getChain);
router.post('/verify', verifyToken, verifyIntegrity);
router.get('/pdf/:evidenciaId', verifyToken, generateTraceabilityPDF);

module.exports = router;
