const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbPath = path.join(__dirname, '../database/gestor_evidencias.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    db.serialize(() => {
      db.all('PRAGMA table_info(evidencias)', (schemaErr, columns) => {
        if (!schemaErr && Array.isArray(columns) && !columns.find(col => col.name === 'firma_avanzada')) {
          db.run('ALTER TABLE evidencias ADD COLUMN firma_avanzada TEXT', (alterErr) => {
            if (alterErr) {
              console.error('Error adding firma_avanzada column:', alterErr.message);
            } else {
              console.log('Migrated database: added firma_avanzada column');
            }
          });
        }
      });
    });
  }
});

// Promisify for consistency
db.getAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.runAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

module.exports = db;