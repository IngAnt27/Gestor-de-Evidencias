const express = require('express');
const router = express.Router();
const { getChain, verifyIntegrity, verifyAdvancedSignature, generateTraceabilityPDF } = require('../controllers/custodiaController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/verify', verifyToken, verifyIntegrity);
router.post('/verify-signature', verifyToken, verifyAdvancedSignature);
router.get('/pdf/:evidenciaId', verifyToken, generateTraceabilityPDF);
router.get('/:evidenciaId', verifyToken, getChain);

module.exports = router;
