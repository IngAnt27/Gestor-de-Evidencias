const { signHash, verifyHashSignature } = require('../utils/signature');

describe('signature utility', () => {
  it('signs and verifies a hash with username and timestamp', () => {
    const hash = 'abc123hashvalor';
    const userName = 'Juan';
    const timestamp = new Date().toISOString();
    const signature = signHash(hash, userName, timestamp);

    expect(signature).toBeTruthy();
    expect(verifyHashSignature(hash, signature, userName, timestamp)).toBe(true);
  });

  it('does not verify when timestamp is wrong', () => {
    const hash = 'abc123hashvalor';
    const userName = 'Juan';
    const timestamp = new Date().toISOString();
    const signature = signHash(hash, userName, timestamp);

    expect(verifyHashSignature(hash, signature, userName, '2000-01-01T00:00:00.000Z')).toBe(false);
  });
});
