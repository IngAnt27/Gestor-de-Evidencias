const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { nombre, email, password, rol = 'consulta' } = req.body;

    // Verificar si el usuario ya existe
    const user = await db.getAsync('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (user) {
      return res.status(400).json({ msg: 'Usuario ya existe' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await db.runAsync(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hashedPassword, rol]
    );

    res.status(201).json({ 
      id: result.lastID,
      nombre,
      email,
      rol,
      msg: 'Usuario registrado exitosamente'
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await db.getAsync('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    // Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};