import { CouponService } from '../services/CouponService.js';
import { pool } from '../config/db.js';

// Mock the database pool
jest.mock('../config/db.js', () => ({
    pool: {
        query: jest.fn(),
        connect: jest.fn()
    }
}));

describe('CouponService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('validateCoupon', () => {
        test('should return invalid if coupon does not exist', async () => {
            const mockClient = {
                query: jest.fn()
                    .mockResolvedValueOnce({}) // BEGIN
                    .mockResolvedValueOnce({ rows: [] }), // SELECT
                release: jest.fn()
            };
            pool.connect.mockResolvedValue(mockClient);

            const result = await CouponService.validateCoupon('INVALIDCODE', 100);

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Invalid coupon code');
            expect(result.statusCode).toBe(404);
        });

        test('should return invalid if coupon is expired', async () => {
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 1);

            const mockClient = {
                query: jest.fn()
                    .mockResolvedValueOnce({}) // BEGIN
                    .mockResolvedValueOnce({ 
                        rows: [{ 
                            code: 'EXPIRED', 
                            is_active: true, 
                            valid_until: expiredDate.toISOString() 
                        }] 
                    }),
                release: jest.fn()
            };
            pool.connect.mockResolvedValue(mockClient);

            const result = await CouponService.validateCoupon('EXPIRED', 100);

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Coupon has expired');
        });

        test('should return valid if coupon meets all criteria', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 10);

            const mockClient = {
                query: jest.fn()
                    .mockResolvedValueOnce({}) // BEGIN
                    .mockResolvedValueOnce({ 
                        rows: [{ 
                            coupon_id: '123',
                            code: 'WELCOME10', 
                            is_active: true, 
                            valid_until: futureDate.toISOString(),
                            min_order_value: 50,
                            max_usage: 100,
                            used_count: 5
                        }] 
                    })
                    .mockResolvedValueOnce({}), // COMMIT
                release: jest.fn()
            };
            pool.connect.mockResolvedValue(mockClient);

            const result = await CouponService.validateCoupon('WELCOME10', 100);

            expect(result.isValid).toBe(true);
            expect(result.coupon.code).toBe('WELCOME10');
        });
    });
});
