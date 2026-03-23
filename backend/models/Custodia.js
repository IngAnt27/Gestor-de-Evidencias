const mongoose = require('mongoose');

const custodySchema = new mongoose.Schema({
  evidencia: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  accion: String
}, { timestamps: true });

module.exports = mongoose.model('Custody', custodySchema);