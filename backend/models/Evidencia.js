const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  tipo: String,
  ruta_archivo: String,
  hash: String,
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  estado: {
    type: String,
    enum: ['activa', 'analisis', 'cerrada'],
    default: 'activa'
  }
}, { timestamps: true });

module.exports = mongoose.model('Evidence', evidenceSchema);
