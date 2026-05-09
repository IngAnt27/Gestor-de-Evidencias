const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keyDir = path.join(__dirname, '..', 'keys');
const privateKeyPath = path.join(keyDir, 'private.pem');
const publicKeyPath = path.join(keyDir, 'public.pem');

const ensureKeyPair = () => {
  if (!fs.existsSync(keyDir)) {
    fs.mkdirSync(keyDir, { recursive: true });
  }

  if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem'
      }
    });

    fs.writeFileSync(privateKeyPath, privateKey, { encoding: 'utf8' });
    fs.writeFileSync(publicKeyPath, publicKey, { encoding: 'utf8' });
  }
};

const getPrivateKey = () => {
  ensureKeyPair();
  return fs.readFileSync(privateKeyPath, 'utf8');
};

const getPublicKey = () => {
  ensureKeyPair();
  return fs.readFileSync(publicKeyPath, 'utf8');
};

const signHash = (hash, userName = '') => {
  const sign = crypto.createSign('RSA-SHA256');
  const timestamp = new Date().toISOString();
  const content = userName ? `${hash}|${userName}|${timestamp}` : hash;
  sign.update(content);
  sign.end();
  return sign.sign(getPrivateKey(), 'base64');
};

const verifyHashSignature = (hash, signature, userName = '') => {
  const verify = crypto.createVerify('RSA-SHA256');
  // Al verificar, intentamos con la nueva estructura primero
  // Si falla, es porque fue firmado con la estructura antigua
  const timestamp = new Date().toISOString().split('T')[0]; // Solo comparamos fecha, no hora exacta
  
  try {
    const verify_new = crypto.createVerify('RSA-SHA256');
    verify_new.update(`${hash}|${userName}|`);
    verify_new.end();
    // Si esto funciona, intentamos la estructura completa
    if (verify.verify(getPublicKey(), signature, 'base64')) {
      return true;
    }
  } catch (e) {
    // Continuar con verificación antigua
  }
  
  // Intenta con estructura antigua
  const verify_old = crypto.createVerify('RSA-SHA256');
  const content = userName ? `${hash}|${userName}` : hash;
  verify_old.update(content);
  verify_old.end();
  return verify_old.verify(getPublicKey(), signature, 'base64');
};

module.exports = {
  signHash,
  verifyHashSignature,
  getPublicKey
};
