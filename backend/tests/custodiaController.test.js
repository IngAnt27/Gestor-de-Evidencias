jest.mock('../db', () => ({
  getAsync: jest.fn(),
  allAsync: jest.fn(),
  runAsync: jest.fn()
}));

jest.mock('../utils/signature', () => ({
  verifyHashSignature: jest.fn()
}));

jest.mock('pdfkit', () => {
  const mockDoc = {
    pipe: jest.fn(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    bufferedPageRange: jest.fn().mockReturnValue({ count: 1 }),
    switchToPage: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    page: { height: 800 }
  };
  return jest.fn(() => mockDoc);
});

const db = require('../db');
const { verifyHashSignature } = require('../utils/signature');
const PDFDocument = require('pdfkit');
const custodiaController = require('../controllers/custodiaController');

describe('Custodia Controller', () => {
  const createResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn();
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getChain should return custody chain data', async () => {
    const req = { params: { evidenciaId: '1' } };
    const res = createResponse();

    db.allAsync.mockResolvedValue([{ id: 1, accion: 'subida', usuario_nombre: 'Admin' }]);

    await custodiaController.getChain(req, res);

    expect(db.allAsync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT cc.*, u.nombre as usuario_nombre'),
      ['1']
    );
    expect(res.json).toHaveBeenCalledWith([{ id: 1, accion: 'subida', usuario_nombre: 'Admin' }]);
  });

  test('verifyIntegrity should return valid response when hashes match', async () => {
    const req = {
      body: { evidenciaId: '2', hashProvided: 'abc123' },
      user: { id: 10 }
    };
    const res = createResponse();

    db.getAsync.mockResolvedValue({ hash_sha256: 'abc123' });
    db.runAsync.mockResolvedValue({ lastID: 5, changes: 1 });

    await custodiaController.verifyIntegrity(req, res);

    expect(db.getAsync).toHaveBeenCalledWith('SELECT hash_sha256 FROM evidencias WHERE id = ?', ['2']);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO cadena_custodia'),
      ['2', 10, 1]
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      valido: true,
      hashEsperado: 'abc123',
      msg: 'Hash verificado exitosamente'
    }));
  });

  test('verifyIntegrity should return 404 when evidence does not exist', async () => {
    const req = {
      body: { evidenciaId: '2', hashProvided: 'abc123' },
      user: { id: 10 }
    };
    const res = createResponse();

    db.getAsync.mockResolvedValue(null);

    await custodiaController.verifyIntegrity(req, res);

    expect(db.getAsync).toHaveBeenCalledWith('SELECT hash_sha256 FROM evidencias WHERE id = ?', ['2']);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Evidencia no encontrada' });
  });

  test('verifyAdvancedSignature should verify advanced signature and log custody action', async () => {
    const req = {
      body: { evidenciaId: '2' },
      user: { id: 11 }
    };
    const res = createResponse();

    db.getAsync
      .mockResolvedValueOnce({ hash_sha256: 'abc123', firma_avanzada: 'sigabc' })
      .mockResolvedValueOnce({ nombre: 'Verifier User' });
    verifyHashSignature.mockReturnValue(true);

    await custodiaController.verifyAdvancedSignature(req, res);

    expect(db.getAsync).toHaveBeenCalledWith(
      'SELECT hash_sha256, firma_avanzada FROM evidencias WHERE id = ? AND eliminado = 0',
      ['2']
    );
    expect(db.getAsync).toHaveBeenCalledWith('SELECT nombre FROM usuarios WHERE id = ?', [11]);
    expect(verifyHashSignature).toHaveBeenCalledWith('abc123', 'sigabc', 'Verifier User');
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO cadena_custodia'),
      ['2', 11, 1]
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      valido: true,
      msg: 'Firma avanzada verificada exitosamente'
    }));
  });

  test('generateTraceabilityPDF should set PDF headers and build the document', async () => {
    const req = { params: { evidenciaId: '1' } };
    const res = createResponse();

    db.getAsync.mockResolvedValue({
      id: 1,
      codigo: 'EV-1',
      nombre_original: 'evidence.pdf',
      tipo: 'documento',
      tamano_bytes: 1024,
      usuario_nombre: 'Admin',
      fecha_subida: '2026-05-01 12:00:00',
      hash_sha256: 'abc123',
      estado: 'activa'
    });
    db.allAsync.mockResolvedValue([
      { id: 1, accion: 'subida', usuario_nombre: 'Admin', hash_valido: null, fecha: '2026-05-01 12:00:00' }
    ]);

    await custodiaController.generateTraceabilityPDF(req, res);

    expect(PDFDocument).toHaveBeenCalledWith(expect.objectContaining({ margin: 40, bufferPages: true }));
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="trazabilidad_EV-1.pdf"'
    );
  });
});
