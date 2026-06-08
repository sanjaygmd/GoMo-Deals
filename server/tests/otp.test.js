import crypto from 'crypto';

describe('OTP Verification Logic Tests', () => {
  it('should successfully match identical OTPs via timingSafeEqual', () => {
    const otp = "123456";
    const hashedInput = crypto.createHash("sha256").update(otp).digest("hex");
    const dbHash = crypto.createHash("sha256").update(otp).digest("hex");

    const hashedInputBuf = Buffer.from(hashedInput, 'hex');
    const dbHashBuf = Buffer.from(dbHash, 'hex');

    expect(hashedInputBuf.length).toBe(dbHashBuf.length);
    expect(crypto.timingSafeEqual(hashedInputBuf, dbHashBuf)).toBe(true);
  });

  it('should fail cleanly when OTPs do not match but lengths are equal', () => {
    const otp1 = "123456";
    const otp2 = "654321";
    const hashedInput = crypto.createHash("sha256").update(otp1).digest("hex");
    const dbHash = crypto.createHash("sha256").update(otp2).digest("hex");

    const hashedInputBuf = Buffer.from(hashedInput, 'hex');
    const dbHashBuf = Buffer.from(dbHash, 'hex');

    expect(hashedInputBuf.length).toBe(dbHashBuf.length);
    expect(crypto.timingSafeEqual(hashedInputBuf, dbHashBuf)).toBe(false);
  });

  it('should avoid throwing errors on length mismatch by guarding the timingSafeEqual call', () => {
    const dbHash = crypto.createHash("sha256").update("123456").digest("hex");
    const dbHashBuf = Buffer.from(dbHash, 'hex');
    
    // Simulate a truncated or corrupted hash
    const corruptedHash = dbHash.slice(0, 32); 
    const corruptedBuf = Buffer.from(corruptedHash, 'hex');

    expect(corruptedBuf.length).not.toBe(dbHashBuf.length);

    // This proves the guard is necessary to prevent throwing an error
    expect(() => {
      crypto.timingSafeEqual(corruptedBuf, dbHashBuf);
    }).toThrow();

    // The actual application logic
    let result = false;
    if (corruptedBuf.length === dbHashBuf.length && crypto.timingSafeEqual(corruptedBuf, dbHashBuf)) {
      result = true;
    }

    expect(result).toBe(false);
  });
});
