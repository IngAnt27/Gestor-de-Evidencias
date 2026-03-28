const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ 
      mensaje: 'Servidor funcionando correctamente',
      base_datos: 'Conexion a MySQL exitosa'
    });
  } catch (error) {
    res.status(500).json({ 
      mensaje: 'Error conectando a la base de datos',
      error: error.message 
    });
  }
});

// Puerto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
