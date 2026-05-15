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

const signHash = (hash, userName = '', timestamp = new Date().toISOString()) => {
  const sign = crypto.createSign('RSA-SHA256');
  const content = userName ? `${hash}|${userName}|${timestamp}` : `${hash}|${timestamp}`;
  sign.update(content);
  sign.end();
  return sign.sign(getPrivateKey(), 'base64');
};

const verifyHashSignature = (hash, signature, userName = '', timestamp = '') => {
  const verifySignature = (content) => {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(content);
    verify.end();
    return verify.verify(getPublicKey(), signature, 'base64');
  };

  if (timestamp) {
    const content = userName ? `${hash}|${userName}|${timestamp}` : `${hash}|${timestamp}`;
    if (verifySignature(content)) return true;
  }

  const legacyContent = userName ? `${hash}|${userName}` : hash;
  return verifySignature(legacyContent);
};

module.exports = {
  signHash,
  verifyHashSignature,
  getPublicKey
};
