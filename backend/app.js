require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

// Verificar conexión a DB al iniciar
console.log('Conectando a base de datos...');
// For SQLite, connection is handled in db.js

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    mensaje: 'API del Gestor de Evidencias funcionando',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      evidencias: '/api/evidencias',
      custodia: '/api/custodia'
    }
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/evidencias', require('./routes/evidenciaRoutes'));
app.use('/api/custodia', require('./routes/custodiaRoutes'));
app.use('/api/reportes', require('./routes/reportesRoutes'));

app.use((err, req, res, next) => {
  res.status(500).json({ msg: err.message });
});

module.exports = app;

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Server en puerto ${PORT}`));
}