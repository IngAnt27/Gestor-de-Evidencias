const Evidence = require('../models/Evidencia');
const Custody = require('../models/Custodia');
const { generateHash } = require('../utils/hash');
const fs = require('fs');

const logAction = async (userId, evidenciaId, accion) => {
  await Custody.create({
    usuario: userId,
    evidencia: evidenciaId,
    accion
  });
};

exports.uploadEvidence = async (req, res) => {
  try {
    const filePath = req.file.path;

    const hash = generateHash(filePath);

    const evidence = await Evidence.create({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      tipo: req.file.mimetype,
      ruta_archivo: filePath,
      hash,
      usuario: req.user.id
    });

    await logAction(req.user.id, evidence._id, 'SUBE ARCHIVO');

    res.status(201).json(evidence);

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.getAll = async (req, res) => {
  const evidencias = await Evidence.find().populate('usuario');
  res.json(evidencias);
};

exports.getById = async (req, res) => {
  const ev = await Evidence.findById(req.params.id);

  if (!ev) return res.status(404).json({ msg: 'No encontrada' });

  await logAction(req.user.id, ev._id, 'CONSULTA');

  res.json(ev);
};

exports.update = async (req, res) => {
  const ev = await Evidence.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  await logAction(req.user.id, ev._id, 'EDITA METADATA');

  res.json(ev);
};

exports.delete = async (req, res) => {
  const ev = await Evidence.findById(req.params.id);

  if (!ev) return res.status(404).json({ msg: 'No encontrada' });

  // ⚠️ No borrar archivo físicamente (principio legal)
  await Evidence.findByIdAndDelete(req.params.id);

  await logAction(req.user.id, ev._id, 'ELIMINA');

  res.json({ msg: 'Eliminada' });
};