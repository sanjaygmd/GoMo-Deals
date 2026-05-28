import twilio from 'twilio';
import dotenv from 'dotenv'

dotenv.config();

export const sendSmsOtp = async (phone, otp) => {
  const sid = process.env.TWILIO_SID;
  const auth = process.env.TWILIO_AUTH;
  const fromPhone = process.env.TWILIO_PHONE;

  if (!sid || !auth || !fromPhone || sid === 'your_twilio_sid_here') {
    console.warn(`[SMS OTP MOCK] Sending OTP ${otp} to ${phone} (Twilio environment variables missing or placeholders)`);
    return;
  }

  try {
    const client = twilio(sid, auth);
    await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: fromPhone,
      to: phone,
    });
  } catch (error) {
    console.error(`[Twilio Error] Failed to send SMS to ${phone}:`, error);
    throw error;
  }
};