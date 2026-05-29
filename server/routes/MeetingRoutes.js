import express from 'express';
import { 
    createMeeting, 
    getSellerMeetings, 
    getCustomerMeetings, 
    cancelMeeting,
    getAdminMeetings,
    completeMeeting
} from '../controllers/MeetingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const meetingRoutes = express.Router();

// Schedule a new B2B video conference (Customer required)
meetingRoutes.post('/', requireAuth(['customer', 'admin', 'super_admin']), createMeeting);

// Fetch scheduled video conferences for the currently logged-in seller (Seller required)
meetingRoutes.get('/seller', requireAuth(['seller', 'admin', 'super_admin']), getSellerMeetings);

// Fetch scheduled video conferences for the currently logged-in customer (Customer required)
meetingRoutes.get('/customer', requireAuth(['customer', 'admin', 'super_admin']), getCustomerMeetings);

// Fetch all scheduled video conferences for mediation (Admin required)
meetingRoutes.get('/admin', requireAuth(['admin', 'super_admin']), getAdminMeetings);

// Cancel a scheduled conference (Authenticated participant required)
meetingRoutes.put('/:id/cancel', requireAuth(['customer', 'seller', 'admin', 'super_admin']), cancelMeeting);

// Complete a meeting (Seller required)
meetingRoutes.put('/seller/:id/complete', requireAuth(['seller']), completeMeeting);

export default meetingRoutes;
