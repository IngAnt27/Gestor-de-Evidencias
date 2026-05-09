const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/gestor_evidencias.db');
const db = new sqlite3.Database(dbPath);

// Crear usuario de prueba
const createTestUser = async () => {
  try {
    const email = 'test@example.com';
    const password = 'Test123!';
    const nombre = 'Usuario Prueba';

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hashedPassword, 'admin'],
      function(err) {
        if (err) {
          console.error('Error creando usuario:', err.message);
          if (err.message.includes('UNIQUE')) {
            console.log('Usuario ya existe en la base de datos');
          }
        } else {
          console.log('✓ Usuario de prueba creado exitosamente');
          console.log(`  Email: ${email}`);
          console.log(`  Contraseña: ${password}`);
          console.log(`  Rol: admin`);
        }
        db.close();
      }
    );
  } catch (error) {
    console.error('Error:', error.message);
    db.close();
  }
};

createTestUser();
