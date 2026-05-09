const db = require('../db');
const { signHash } = require('../utils/signature');
const evidenciaController = require('../controllers/evidenciaController');

jest.mock('../db', () => ({
  getAsync: jest.fn(),
  allAsync: jest.fn(),
  runAsync: jest.fn()
}));

jest.mock('../utils/signature', () => ({
  signHash: jest.fn(),
  verifyHashSignature: jest.fn()
}));

describe('Evidencia Controller', () => {
  const createResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('signEvidence should update advanced signature and log custody action', async () => {
    const req = {
      params: { id: '2' },
      user: { id: 5 }
    };
    const res = createResponse();

    db.getAsync
      .mockResolvedValueOnce({ id: 2, hash_sha256: 'abc123' })
      .mockResolvedValueOnce({ nombre: 'Admin User' });
    signHash.mockReturnValue('signed-base64');

    await evidenciaController.signEvidence(req, res);

    expect(db.getAsync).toHaveBeenCalledWith(
      'SELECT id, hash_sha256 FROM evidencias WHERE id = ? AND eliminado = 0',
      ['2']
    );
    expect(db.getAsync).toHaveBeenCalledWith('SELECT nombre FROM usuarios WHERE id = ?', [5]);
    expect(signHash).toHaveBeenCalledWith('abc123', 'Admin User');
    expect(db.runAsync).toHaveBeenCalledWith(
      'UPDATE evidencias SET firma_avanzada = ? WHERE id = ?',
      ['signed-base64', '2']
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: '2',
      firma_avanzada: 'signed-base64'
    }));
  });

  test('signEvidence returns 404 if evidence does not exist', async () => {
    const req = {
      params: { id: '3' },
      user: { id: 5 }
    };
    const res = createResponse();

    db.getAsync.mockResolvedValue(null);

    await evidenciaController.signEvidence(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Evidencia no encontrada' });
  });
});
