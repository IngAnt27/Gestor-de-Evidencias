const express = require('express');
const router = express.Router();
const { getChain, signAdvancedSignature, verifyIntegrity, verifyAdvancedSignature, verifyDoubleCheck, generateTraceabilityPDF } = require('../controllers/custodiaController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:evidenciaId', verifyToken, getChain);
router.post('/verify', verifyToken, verifyIntegrity);
router.post('/verify-double', verifyToken, verifyDoubleCheck);
router.post('/sign', verifyToken, signAdvancedSignature);
router.post('/verify-signature', verifyToken, verifyAdvancedSignature);
router.get('/pdf/:evidenciaId', verifyToken, generateTraceabilityPDF);

module.exports = router;
