const request = require('supertest');
const express = require('express');

// Test básico sin BD
describe('Backend - Tests Básicos', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Ruta de prueba simple
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });
  });

  it('should return health check', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('ok');
  });
});