const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/gestor_evidencias.db');
const schemaPath = path.join(__dirname, '../database/schema_sqlite.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

const createCustodiaTableSql = `CREATE TABLE IF NOT EXISTS cadena_custodia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evidencia_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    accion TEXT NOT NULL CHECK (accion IN (
        'subida',
        'visualizacion',
        'descarga',
        'edicion_metadata',
        'cambio_estado',
        'eliminacion',
        'firma_avanzada',
        'verificacion_hash',
        'verificacion_firma',
        'verificacion_judicial'
    )),
    detalle TEXT,
    ip_origen TEXT,
    user_agent TEXT,
    hash_valido INTEGER,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evidencia_id) REFERENCES evidencias(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);`;

const applySchema = (db) => {
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
};

const migrateCustodiaTable = (db) => {
  const migrationSql = `PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
ALTER TABLE cadena_custodia RENAME TO cadena_custodia_old;
${createCustodiaTableSql}
INSERT INTO cadena_custodia (id, evidencia_id, usuario_id, accion, detalle, ip_origen, user_agent, hash_valido, fecha)
SELECT id, evidencia_id, usuario_id, accion, detalle, ip_origen, user_agent, hash_valido, fecha FROM cadena_custodia_old;
DROP TABLE cadena_custodia_old;
COMMIT;
PRAGMA foreign_keys=ON;`;

  db.exec(migrationSql, (err) => {
    if (err) {
      console.error('Error migrating schema:', err.message);
      process.exit(1);
    }
    console.log('Existing database schema migrated successfully.');
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database migration completed.');
      }
    });
  });
};

if (fs.existsSync(dbPath)) {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening existing database:', err.message);
      process.exit(1);
    }
  });

  db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='cadena_custodia';", (err, row) => {
    if (err) {
      console.error('Error reading existing schema:', err.message);
      process.exit(1);
    }

    if (!row) {
      console.log('Existing database found, but cadena_custodia table is missing. Applying full schema.');
      applySchema(db);
      return;
    }

    if (row.sql.includes("'verificacion_judicial'") || row.sql.includes('"verificacion_judicial"')) {
      console.log('Existing database schema already includes verificacion_judicial. No migration needed.');
      db.close();
      return;
    }

    console.log('Existing database schema requires migration for verificacion_judicial.');
    migrateCustodiaTable(db);
  });
} else {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error creating database:', err.message);
      process.exit(1);
    }
    console.log('Database created successfully.');
  });

  applySchema(db);
}
