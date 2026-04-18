const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/gestor_evidencias.db');
const schemaPath = path.join(__dirname, '../database/schema_sqlite.sql');

// Delete existing db if exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error creating database:', err.message);
    process.exit(1);
  }
  console.log('Database created successfully.');
});

const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema, (err) => {
  if (err) {
    console.error('Error executing schema:', err.message);
    process.exit(1);
  }
  console.log('Schema applied successfully.');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database initialized.');
    }
  });
});