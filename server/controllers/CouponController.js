import { logAudit } from '../utils/auditLogger.js';
import { CouponService } from '../services/CouponService.js';

// Get all active coupons
export const getActiveCoupons = async (req, res, next) => {
    try {
        const coupons = await CouponService.getActiveCoupons();
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        next(error);
    }
};

// Validate and get coupon by code
export const validateCoupon = async (req, res, next) => {
    const { code, subtotal } = req.body;
    try {
        const customerId = req.user ? req.user.id : null;
        const result = await CouponService.validateCoupon(code, subtotal, customerId);

        if (!result.isValid) {
            return res.status(result.statusCode).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, data: result.coupon });
    } catch (error) {
        next(error);
    }
};

// For Admin: Get all coupons
export const getAllCoupons = async (req, res, next) => {
    try {
        const coupons = await CouponService.getAllCoupons();
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        next(error);
    }
};

// Create a new coupon
export const createCoupon = async (req, res, next) => {
    try {
        const isAdmin = req.user.type === 'admin';
        const newCoupon = await CouponService.createCoupon(req.body, req.user.id, isAdmin);
        
        await logAudit({
            admin_id: req.user.id,
            action: 'CREATE_COUPON',
            table_name: 'coupons',
            record_id: newCoupon.coupon_id,
            new_values: newCoupon,
            req
        });

        res.status(201).json({ success: true, message: "Coupon created successfully", data: newCoupon });
    } catch (error) {
        next(error);
    }
};

// Update a coupon
export const updateCoupon = async (req, res, next) => {
    const { id } = req.params;
    try {
        const isAdmin = req.user.type === 'admin';
        const result = await CouponService.updateCoupon(id, req.body, req.user.id, isAdmin);

        if (!result) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        await logAudit({
            admin_id: req.user.id,
            action: 'UPDATE_COUPON',
            table_name: 'coupons',
            record_id: id,
            old_values: result.old,
            new_values: result.updated,
            req
        });

        res.status(200).json({ success: true, message: "Coupon updated successfully", data: result.updated });
    } catch (error) {
        next(error);
    }
};

// Delete a coupon
export const deleteCoupon = async (req, res, next) => {
    const { id } = req.params;
    try {
        const deletedCoupon = await CouponService.deleteCoupon(id);
        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        await logAudit({
            admin_id: req.user.id,
            action: 'DELETE_COUPON',
            table_name: 'coupons',
            record_id: id,
            old_values: deletedCoupon,
            req
        });

        res.status(200).json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        next(error);
    }
};


