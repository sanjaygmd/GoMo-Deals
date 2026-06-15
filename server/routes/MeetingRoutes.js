import express from 'express';
import rateLimit from 'express-rate-limit';
import { 
    createMeeting, 
    getSellerMeetings, 
    getCustomerMeetings, 
    cancelMeeting,
    getAdminMeetings,
    completeMeeting,
    endMeeting,
    recordMeetingOutcome,
    rescheduleMeeting,
    getMeetingById
} from '../controllers/MeetingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const meetingRoutes = express.Router();

const meetingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.user?.id || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
    message: { success: false, message: "You have reached the limit of 5 meetings per hour. Please try again later." }
});

// Schedule a new B2B video conference (Customer required)
meetingRoutes.post('/', requireAuth(['customer', 'admin', 'super_admin']), meetingLimiter, createMeeting);

// Fetch scheduled video conferences for the currently logged-in seller (Seller required)
meetingRoutes.get('/seller', requireAuth(['seller', 'admin', 'super_admin']), getSellerMeetings);

// Fetch scheduled video conferences for the currently logged-in customer (Customer required)
meetingRoutes.get('/customer', requireAuth(['customer', 'admin', 'super_admin']), getCustomerMeetings);

// Fetch all scheduled video conferences for mediation (Admin required)
meetingRoutes.get('/admin', requireAuth(['admin', 'super_admin']), getAdminMeetings);

// Fetch a single meeting by ID
meetingRoutes.get('/:id', requireAuth(['customer', 'seller', 'admin', 'super_admin']), getMeetingById);

// Cancel a scheduled conference (Authenticated participant required)
meetingRoutes.put('/:id/cancel', requireAuth(['customer', 'seller', 'admin', 'super_admin']), cancelMeeting);

// Reschedule a conference (Authenticated participant required)
meetingRoutes.put('/:id/reschedule', requireAuth(['customer', 'seller', 'admin', 'super_admin']), rescheduleMeeting);

// Complete a meeting (Seller required)
meetingRoutes.put('/seller/:id/complete', requireAuth(['seller']), completeMeeting);

// End a meeting (Participant or Admin required)
meetingRoutes.put('/:id/end', requireAuth(['customer', 'seller', 'admin', 'super_admin']), endMeeting);

// Admin records the outcome of a meeting
meetingRoutes.post('/:id/admin/record-outcome', requireAuth(['admin', 'super_admin']), recordMeetingOutcome);

export default meetingRoutes;
