const express = require('express');
const router = express.Router();
const { getReports, generateCertificatePDF, getStatistics } = require('../controllers/reportesController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getReports);
router.get('/pdf/:evidenciaId', verifyToken, generateCertificatePDF);
router.get('/estadisticas', verifyToken, getStatistics);

module.exports = router;
