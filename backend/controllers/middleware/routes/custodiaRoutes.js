const express = require('express');
const router = express.Router();
const Custody = require('../models/Custodia');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:evidencia_id', verifyToken, async (req, res) => {
  const logs = await Custody.find({
    evidencia: req.params.evidencia_id
  }).populate('usuario');

  res.json(logs);
});

module.exports = router;