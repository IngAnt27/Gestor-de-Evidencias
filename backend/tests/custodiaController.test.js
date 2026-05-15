const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

jest.mock('../db', () => ({
  getAsync: jest.fn(),
  runAsync: jest.fn()
}));

const db = require('../db');
const {
  verifyIntegrity,
  signAdvancedSignature,
  verifyAdvancedSignature,
  verifyDoubleCheck
} = require('../controllers/custodiaController');

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const uploadsDir = path.join(__dirname, '..', 'uploads');
const validFilePath = path.join(uploadsDir, 'custodia_valid.txt');
const invalidFilePath = path.join(uploadsDir, 'custodia_invalid.txt');
const validFileContent = 'Contenido de prueba para hash válido';
const invalidFileContent = 'Contenido alterado para hash inválido';
const validHash = crypto.createHash('sha256').update(validFileContent).digest('hex');
const invalidHash = crypto.createHash('sha256').update(invalidFileContent).digest('hex');

beforeAll(() => {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(validFilePath, validFileContent);
  fs.writeFileSync(invalidFilePath, invalidFileContent);
});

afterAll(() => {
  if (fs.existsSync(validFilePath)) fs.unlinkSync(validFilePath);
  if (fs.existsSync(invalidFilePath)) fs.unlinkSync(invalidFilePath);
});

describe('custodiaController.verifyIntegrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify hash successfully using the actual file content', async () => {
    db.getAsync.mockResolvedValue({ hash_sha256: validHash, ruta_archivo: 'uploads/custodia_valid.txt' });
    db.runAsync.mockResolvedValue({ lastID: 1, changes: 1 });

    const req = {
      body: { evidenciaId: 42 },
      user: { id: 7 }
    };
    const res = createResponse();

    await verifyIntegrity(req, res);

    expect(db.getAsync).toHaveBeenCalledWith(
      'SELECT hash_sha256, ruta_archivo FROM evidencias WHERE id = ? AND eliminado = 0',
      [42]
    );
    expect(db.runAsync).toHaveBeenCalledWith(
      `INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, hash_valido, detalle)
       VALUES (?, ?, 'verificacion_hash', ?, ?)`,
      [42, 7, 1, 'Hash calculado coincide con el hash registrado']
    );
    expect(res.json).toHaveBeenCalledWith({
      valido: true,
      hashEsperado: validHash,
      hashCalculado: validHash,
      msg: 'Hash verificado exitosamente'
    });
  });

  it('should return invalid when file hash does not match stored hash', async () => {
    db.getAsync.mockResolvedValue({ hash_sha256: validHash, ruta_archivo: 'uploads/custodia_invalid.txt' });
    db.runAsync.mockResolvedValue({ lastID: 2, changes: 1 });

    const req = {
      body: { evidenciaId: 55 },
      user: { id: 9 }
    };
    const res = createResponse();

    await verifyIntegrity(req, res);

    expect(db.getAsync).toHaveBeenCalledWith(
      'SELECT hash_sha256, ruta_archivo FROM evidencias WHERE id = ? AND eliminado = 0',
      [55]
    );
    expect(db.runAsync).toHaveBeenCalledWith(
      `INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, hash_valido, detalle)
       VALUES (?, ?, 'verificacion_hash', ?, ?)`,
      [55, 9, 0, 'Hash calculado no coincide con el hash registrado']
    );
    expect(res.json).toHaveBeenCalledWith({
      valido: false,
      hashEsperado: validHash,
      hashCalculado: invalidHash,
      msg: 'Archivo no coincide o corrupto - posible alteración detectada'
    });
  });
});

describe('custodiaController.signAdvancedSignature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sign evidence and create advanced signature record', async () => {
    db.getAsync
      .mockResolvedValueOnce({ hash_sha256: validHash })
      .mockResolvedValueOnce({ id: 7, nombre: 'Juan' });
    db.runAsync.mockResolvedValue({ lastID: 1, changes: 1 });

    const req = {
      body: { evidenciaId: 88 },
      user: { id: 7 }
    };
    const res = createResponse();

    await signAdvancedSignature(req, res);

    expect(db.getAsync).toHaveBeenNthCalledWith(
      1,
      'SELECT hash_sha256 FROM evidencias WHERE id = ? AND eliminado = 0',
      [88]
    );
    expect(db.getAsync).toHaveBeenNthCalledWith(
      2,
      'SELECT id, nombre FROM usuarios WHERE id = ?',
      [7]
    );
    expect(db.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE evidencias'),
      [expect.any(String), 'Juan', expect.any(String), 88]
    );
    expect(db.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO cadena_custodia'),
      [88, 7, expect.any(String)]
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      msg: 'Firma electrónica avanzada generada exitosamente',
      usuario: 'Juan'
    }));
  });
});

describe('custodiaController.verifyAdvancedSignature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify advanced signature successfully', async () => {
    const { signHash } = require('../utils/signature');
    const firmaTimestamp = new Date().toISOString();
    const firma_avanzada = signHash(validHash, 'Juan', firmaTimestamp);

    db.getAsync.mockResolvedValue({
      hash_sha256: validHash,
      firma_avanzada,
      firma_usuario_nombre: 'Juan',
      firma_timestamp: firmaTimestamp
    });
    db.runAsync.mockResolvedValue({ lastID: 3, changes: 1 });

    const req = {
      body: { evidenciaId: 99 },
      user: { id: 7 }
    };
    const res = createResponse();

    await verifyAdvancedSignature(req, res);

    expect(db.getAsync).toHaveBeenCalledWith(
      'SELECT hash_sha256, firma_avanzada, firma_usuario_nombre, firma_timestamp FROM evidencias WHERE id = ? AND eliminado = 0',
      [99]
    );
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO cadena_custodia'),
      [99, 7, 1, expect.stringContaining('Verificado firma de Juan')]
    );
    expect(res.json).toHaveBeenCalledWith({
      valido: true,
      usuario_firma: 'Juan',
      msg: 'Firma avanzada verificada exitosamente'
    });
  });
});

describe('custodiaController.verifyDoubleCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should perform judicial double-check successfully', async () => {
    db.getAsync.mockResolvedValue({
      hash_sha256: validHash,
      ruta_archivo: 'uploads/custodia_valid.txt',
      nombre_original: 'custodia_valid.txt',
      tipo: 'documento',
      tamano_bytes: Buffer.byteLength(validFileContent)
    });
    db.runAsync.mockResolvedValue({ lastID: 4, changes: 1 });

    const req = {
      body: { evidenciaId: 101 },
      user: { id: 7 }
    };
    const res = createResponse();

    await verifyDoubleCheck(req, res);

    expect(db.getAsync).toHaveBeenCalledWith(
      'SELECT hash_sha256, ruta_archivo, nombre_original, tipo, tamano_bytes FROM evidencias WHERE id = ? AND eliminado = 0',
      [101]
    );
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO cadena_custodia'),
      [101, 7, 1, expect.stringContaining('Verificación judicial completa')]
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      archivoExiste: true,
      hashValido: true,
      tamanoCoincide: true,
      tipoCoincide: true,
      verificacionCompleta: true,
      msg: 'Verificación judicial completa: Archivo íntegro y auténtico'
    }));
  });
});
