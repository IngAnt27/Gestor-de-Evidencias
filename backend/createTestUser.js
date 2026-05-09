const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database/gestor_evidencias.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('Connected to database');
});

// Promisify db methods
const runAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const createTestUser = async () => {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await runAsync(
      `INSERT INTO usuarios (nombre, email, password_hash, rol) 
       VALUES (?, ?, ?, ?)`,
      ['Juan Carlos López', 'juan@example.com', hashedPassword, 'investigador']
    );
    
    console.log('Test user created successfully');
    console.log('Email: juan@example.com');
    console.log('Password: password123');
    console.log('Nombre: Juan Carlos López');
    console.log('Rol: investigador');
    
    db.close();
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser();
