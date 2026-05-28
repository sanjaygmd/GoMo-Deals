import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred SMTP service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a password reset link to an administrator.
 * 
 * @param {string} email - Recipient email
 * @param {string} name - Administrator name
 * @param {string} resetToken - The short-lived reset token
 */
export const sendAdminPasswordResetEmail = async (email, name, otp) => {
  const mailOptions = {
    from: `"GoMo Deals Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Administrative Password Reset - Verification Code',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2563eb; margin: 0;">GoMo Deals</h2>
          <p style="color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Administrative Portal</p>
        </div>
        
        <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 30px;">
          <p style="font-size: 16px; color: #0f172a;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            A password reset was requested for your administrative account. 
            Please use the 6-digit verification code below to set a new password:
          </p>
          
          <div style="margin: 25px 0; padding: 15px; background-color: #ffffff; border: 1.5px dashed #2563eb; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">Password Reset Code</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; color: #2563eb; font-family: monospace; font-weight: bold; letter-spacing: 4px;">${otp}</p>
          </div>
          
          <p style="font-size: 13px; color: #ef4444; font-weight: bold;">
            ⚠️ Important: This code will expire in 15 minutes. Do not share it with anyone.
          </p>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            This is an automated security notification. If you did not request this, please contact the Super Admin immediately.
          </p>
          <p style="font-size: 11px; color: #cbd5e1; margin-top: 5px;">&copy; 2026 GoMo Deals Marketplace</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("[MAILER] Error sending email:", error);
    return { success: false, error };
  }
};

/**
 * Sends a registration OTP email for Admin / Super Admin signup.
 *
 * @param {string} email - Recipient email
 * @param {string} name - Admin name
 * @param {string} otp - The 6-digit OTP
 * @param {string} accountType - 'admin' or 'super_admin'
 */
export const sendAdminRegisterOTP = async (email, name, otp, accountType = 'admin') => {
  const isSuperAdmin = accountType === 'super_admin';
  const accentColor = isSuperAdmin ? '#7c3aed' : '#f97316';
  const roleLabel = isSuperAdmin ? 'Super Admin' : 'Administrator';

  const mailOptions = {
    from: `"GoMo Deals Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${roleLabel} Registration — Email Verification Code`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid ${accentColor};">
          <h2 style="color: ${accentColor}; margin: 0; font-size: 22px;">GoMo Deals</h2>
          <p style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin: 6px 0 0;">${roleLabel} Portal</p>
        </div>

        <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 16px; color: #0f172a; margin: 0 0 10px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.7; margin: 0;">
            You are registering a new <strong>${roleLabel}</strong> account on GoMo Deals.
            Use the 6-digit verification code below to confirm your email and complete registration:
          </p>

          <div style="margin: 28px 0 10px; padding: 18px; background-color: #ffffff; border: 2px dashed ${accentColor}; border-radius: 10px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: bold; letter-spacing: 2px;">Registration Code</p>
            <p style="margin: 12px 0 0; font-size: 38px; color: ${accentColor}; font-family: monospace; font-weight: bold; letter-spacing: 6px;">${otp}</p>
          </div>

          <p style="font-size: 13px; color: #ef4444; font-weight: bold; margin: 14px 0 0;">
            ⚠️ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
        </div>

        <div style="background: #fff7ed; border-left: 4px solid ${accentColor}; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
          <p style="font-size: 13px; color: #7c2d12; margin: 0; line-height: 1.6;">
            If you did not initiate this registration, please ignore this email.
            Your account will <strong>not</strong> be created without the verification code.
          </p>
        </div>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <p style="font-size: 11px; color: #cbd5e1; margin: 0;">© 2026 GoMo Deals Marketplace · Administrative Portal</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Admin registration OTP sent to ${email} (${accountType})`);
    return { success: true };
  } catch (error) {
    console.error("[MAILER] Error sending registration OTP:", error);
    return { success: false, error };
  }
};

/**
 * Sends a 2FA OTP email for Super Admin login.
 * 
 * @param {string} email - Recipient email
 * @param {string} name - Administrator name
 * @param {string} otp - The 6-digit OTP
 */
export const sendSuperAdminLoginOTP = async (email, name, otp) => {
  const mailOptions = {
    from: `"GoMo Deals Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Super Admin Login - 2FA Verification Code',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6366f1; margin: 0;">GoMo Deals</h2>
          <p style="color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Super Admin Secure Portal</p>
        </div>
        
        <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 30px;">
          <p style="font-size: 16px; color: #0f172a;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            We detected a login attempt to your Super Admin account.
            Please use the 6-digit verification code below to complete your login:
          </p>
          
          <div style="margin: 25px 0; padding: 15px; background-color: #ffffff; border: 1.5px dashed #6366f1; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">2FA Verification Code</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; color: #6366f1; font-family: monospace; font-weight: bold; letter-spacing: 4px;">${otp}</p>
          </div>
          
          <p style="font-size: 13px; color: #ef4444; font-weight: bold;">
            ⚠️ Important: This code will expire in 5 minutes. Do not share it with anyone.
          </p>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            If you did not attempt to log in, please secure your account immediately.
          </p>
          <p style="font-size: 11px; color: #cbd5e1; margin-top: 5px;">&copy; 2026 GoMo Deals Marketplace</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Super Admin 2FA email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("[MAILER] Error sending 2FA email:", error);
    return { success: false, error };
  }
};

/**
 * Sends a generic verification OTP.
 */
export const sendEmailOtp = async (email, otp, purpose = 'registration') => {
  const mailOptions = {
    from: `"GoMo Deals Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your ${purpose} Verification Code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Verification Code</h2>
        <p style="font-size: 16px; color: #666;">Hello,</p>
        <p style="font-size: 16px; color: #666;">Use the following code to verify your ${purpose}:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px;">
          <h1 style="margin: 0; color: #000; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #999; margin-top: 20px;">This code will expire in 10 minutes.</p>
        <p style="font-size: 14px; color: #999;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};
/**
 * Sends an order confirmation email to the customer.
 * 
 * @param {Object} params - Order details
 */
export const sendOrderConfirmationEmail = async ({ customerName, customerEmail, orderId, total, paymentMethod, address }) => {
  const mailOptions = {
    from: `"GoMo Deals Boutique" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: `Order Confirmed — #${orderId?.slice(-8).toUpperCase() || 'GoMo'}`,
    html: `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #fafaf9; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid #e5e7eb;">
          <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 400; color: #171717; font-style: italic;">GoMo Deals Boutique</h1>
          <p style="margin: 0; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #9ca3af;">Premium Curated Collection</p>
        </div>

        <div style="margin-bottom: 36px;">
          <p style="font-size: 16px; color: #374151; margin: 0 0 8px 0;">Dear <strong>${customerName}</strong>,</p>
          <p style="font-size: 14px; color: #6b7280; line-height: 1.7; margin: 0;">
            Thank you for your order. We are delighted to be part of your shopping journey and are already preparing your selection with care.
          </p>
        </div>

        <div style="background-color: #171717; color: #ffffff; padding: 24px 28px; margin-bottom: 28px;">
          <p style="margin: 0 0 4px 0; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #9ca3af;">Order Reference</p>
          <p style="margin: 0; font-size: 22px; font-family: monospace; letter-spacing: 2px;">GoMo-${orderId?.slice(-8).toUpperCase() || '--------'}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af;">Total Payable</td>
            <td style="padding: 12px 0; font-size: 15px; font-weight: 600; color: #171717; text-align: right;">₹${Number(total).toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af;">Payment Method</td>
            <td style="padding: 12px 0; font-size: 13px; color: #374151; text-align: right;">${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; vertical-align: top;">Delivery Address</td>
            <td style="padding: 12px 0; font-size: 13px; color: #374151; text-align: right; line-height: 1.6;">${address}</td>
          </tr>
        </table>

        <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; padding: 20px 24px; margin-bottom: 36px;">
          <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.7;">
            Our team will carefully package your selection and dispatch it shortly. You will receive a tracking update once your order is on its way.
          </p>
        </div>

        <div style="text-align: center; padding-top: 28px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #d1d5db; margin: 0; letter-spacing: 2px; text-transform: uppercase;">© 2026 GoMo Deals Boutique · All Rights Reserved</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Order confirmation sent to ${customerEmail} for order ${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('[MAILER] Order confirmation email failed:', error);
    return { success: false, error };
  }
};
