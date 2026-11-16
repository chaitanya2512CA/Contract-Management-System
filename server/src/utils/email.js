import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is explicitly loaded before any transporter or email logic initializes
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let transporterInstance = null;

/**
 * Creates a fresh Nodemailer transporter instance with strict trim on credentials
 */
export const createFreshTransporter = (options = {}) => {
  let user = (process.env.EMAIL_USER || '').trim();
  // Sanitize common domain typos (e.g. @gamil.com -> @gmail.com)
  if (/@gamil\.com$/i.test(user)) {
    console.warn(`[Email Service Warning] Auto-correcting typo in EMAIL_USER: ${user} -> ${user.replace(/@gamil\.com$/i, '@gmail.com')}`);
    user = user.replace(/@gamil\.com$/i, '@gmail.com');
  }

  const pass = (process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

  if (
    !user ||
    !pass ||
    user === 'your-email@gmail.com' ||
    pass === 'your-16-character-app-password'
  ) {
    return null;
  }

  // Standard Gmail SMTP port 465 (SSL) by default, or port 587 (TLS) if specified
  const port = options.port !== undefined
    ? options.port
    : (process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465);
  const secure = options.secure !== undefined
    ? options.secure
    : (port === 465);

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: port,
    secure: secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Returns a configured Nodemailer transporter using Gmail SMTP.
 * In serverless environments, forceFresh=true ensures a new connection is created.
 */
export const getTransporter = (forceFresh = true) => {
  if (forceFresh || !transporterInstance) {
    transporterInstance = createFreshTransporter();
  }
  return transporterInstance;
};

/**
 * Resolves the public application URL for transactional email links and redirects
 */
export const resolveAppUrl = () => {
  if (process.env.CLIENT_URL && process.env.CLIENT_URL.trim() !== '') {
    return process.env.CLIENT_URL.trim().replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim() !== '') {
    const vUrl = process.env.VERCEL_URL.trim();
    return vUrl.startsWith('http') ? vUrl.replace(/\/+$/, '') : `https://${vUrl.replace(/\/+$/, '')}`;
  }
  return 'https://contract-management-system-dun.vercel.app';
};

/**
 * Sends a welcome email to newly registered users
 * Styled with JurisFlow's Executive Dark & Gold aesthetic
 *
 * @param {string} toEmail - Recipient email
 * @param {string} userName - User display name
 * @returns {Promise<{success: boolean, messageId?: string, skipped?: boolean, error?: string}>}
 */
export const sendWelcomeEmail = async (toEmail, userName = 'Valued Member') => {
  try {
    const transporter = getTransporter(true);
    const appUrl = resolveAppUrl();
    let cleanUser = (process.env.EMAIL_USER || '').trim();
    if (/@gamil\.com$/i.test(cleanUser)) {
      cleanUser = cleanUser.replace(/@gamil\.com$/i, '@gmail.com');
    }
    const fromAddress = cleanUser
      ? `"JurisFlow" <${cleanUser}>`
      : '"JurisFlow" <no-reply@jurisflow.com>';

    if (!transporter) {
      console.warn(
        `[Email Service] SMTP credentials (EMAIL_USER / EMAIL_PASS) not configured. Welcome email to ${toEmail} was not dispatched via SMTP.`
      );
      return { success: false, skipped: true, message: 'SMTP not configured' };
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to JurisFlow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080808; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5e6c4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080808; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #121212; border: 1px solid #262118; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
          <!-- Header Bar -->
          <tr>
            <td style="padding: 35px 40px 25px; text-align: center; border-bottom: 1px solid #262118; background: linear-gradient(180deg, #181818 0%, #121212 100%);">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: #1c1c1c; border: 1px solid #d4af37; text-align: center; margin-bottom: 12px;">
                <span style="font-size: 24px; color: #d4af37;">⚖️</span>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">JurisFlow</h1>
              <p style="margin: 6px 0 0; font-size: 13px; font-weight: 500; color: #d4af37; letter-spacing: 0.5px;">Your Legal World, Organized in One Flow.</p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #ffffff;">Welcome aboard, ${escapeHtml(userName)}!</h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #a39e93;">
                We are thrilled to welcome you to <strong>JurisFlow</strong>. Your account has been successfully created and configured. You now have full access to our intelligent legal management platform, instant consultation network, and enterprise-grade contract workspace.
              </p>

              <!-- Feature Highlights -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 25px 0; background: #181818; border: 1px solid #262118; border-radius: 12px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #262118;">
                    <div style="font-size: 13px; font-weight: 700; color: #ffffff;">🔒 Enterprise Legal Vault</div>
                    <div style="font-size: 12px; color: #a39e93; margin-top: 3px;">Organize, analyze, and automate contracts with verified audit trails.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #262118;">
                    <div style="font-size: 13px; font-weight: 700; color: #ffffff;">💬 Instant Legal Consultation</div>
                    <div style="font-size: 12px; color: #a39e93; margin-top: 3px;">Astrotalk-style real-time messaging, audio, and video sessions with certified advocates.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 13px; font-weight: 700; color: #ffffff;">⚡ Smart Risk Analysis</div>
                    <div style="font-size: 12px; color: #a39e93; margin-top: 3px;">Automated clause risk assessment and compliance scoring.</div>
                  </td>
                </tr>
              </table>

              <!-- Call to Action -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0 15px; text-align: center;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/login" style="display: inline-block; padding: 14px 34px; background-color: #d4af37; color: #080808; font-size: 13px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25);">
                      Launch JurisFlow Workspace →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #0e0e0e; border-top: 1px solid #262118; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 11px; color: #666158;">
                This transactional email was sent to <span style="color: #a39e93;">${escapeHtml(toEmail)}</span> regarding your JurisFlow account registration.
              </p>
              <p style="margin: 0; font-size: 11px; color: #666158;">
                &copy; ${new Date().getFullYear()} JurisFlow. All legal rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Welcome to JurisFlow, ${userName}!

Your Legal World, Organized in One Flow.

Your account has been successfully created and configured. You now have full access to our intelligent legal management platform, verified advocate directory, and contract workspace.

Launch your workspace: ${appUrl}/login

© ${new Date().getFullYear()} JurisFlow. All rights reserved.
    `.trim();

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: 'Welcome to JurisFlow — Your Legal World, Organized in One Flow.',
      text: textContent,
      html: htmlContent,
    });

    console.log(`[Email Service] Welcome email dispatched successfully to ${toEmail}. MessageId: ${info.messageId}`);
    console.log(`[Email Service SMTP Response] Accepted: ${JSON.stringify(info.accepted)}, Response: "${info.response}"`);
    return { success: true, messageId: info.messageId, response: info.response, envelope: info.envelope };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send welcome email to ${toEmail}:`, {
      message: error.message,
      code: error.code,
      response: error.response,
      command: error.command,
      responseCode: error.responseCode,
      stack: error.stack,
    });
    return { success: false, error: error.message, code: error.code, response: error.response };
  }
};

/**
 * Sends a 6-digit OTP code for password recovery
 * Mentions 10-minute expiration prominently
 *
 * @param {string} toEmail - Recipient email
 * @param {string|number} otp - 6-digit verification code
 * @returns {Promise<{success: boolean, messageId?: string, skipped?: boolean, error?: string}>}
 */
export const sendOtpEmail = async (toEmail, otp, recipientName = 'Valued Member') => {
  try {
    const transporter = getTransporter(true);
    let cleanUser = (process.env.EMAIL_USER || '').trim();
    if (/@gamil\.com$/i.test(cleanUser)) {
      cleanUser = cleanUser.replace(/@gamil\.com$/i, '@gmail.com');
    }
    const fromAddress = cleanUser
      ? `"JurisFlow Security" <${cleanUser}>`
      : '"JurisFlow Security" <no-reply@jurisflow.com>';

    if (!transporter) {
      console.warn(
        `[Email Service] SMTP credentials (EMAIL_USER / EMAIL_PASS) not configured. OTP for ${toEmail} is: [${otp}] (expires in 10 minutes).`
      );
      return { success: false, skipped: true, message: 'SMTP not configured' };
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JurisFlow Password Reset Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080808; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5e6c4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080808; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #121212; border: 1px solid #262118; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
          <!-- Header Bar -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 1px solid #262118; background: linear-gradient(180deg, #181818 0%, #121212 100%);">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: #1c1c1c; border: 1px solid #d4af37; text-align: center; margin-bottom: 10px;">
                <span style="font-size: 22px; color: #d4af37;">⚖️</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff;">JurisFlow</h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: #d4af37; font-weight: 600;">Account Security & Recovery</p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 35px 40px 25px;">
              <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #ffffff;">Password Reset Verification Code</h2>
              <p style="margin: 0 0 22px; font-size: 13px; line-height: 1.6; color: #a39e93;">
                A password reset request was initiated for your JurisFlow account. Use the 6-digit verification code below to authorize the update:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #1a1a1a; border: 1px solid #d4af37; border-radius: 14px; padding: 20px; text-align: center; max-width: 320px;">
                      <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #a39e93; margin-bottom: 8px;">Your 6-Digit OTP Code</div>
                      <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #d4af37; user-select: all;">${otp}</div>
                      <div style="font-size: 11px; font-weight: 600; color: #f59e0b; margin-top: 8px;">⏱️ Expires in 10 minutes</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiration Warning Alert -->
              <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 12px 16px; margin: 25px 0 15px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #fca5a5;">
                  <strong>Important Security Notice:</strong> This code is valid for <strong>10 minutes</strong> only. Do not share this OTP with anyone, including JurisFlow staff.
                </p>
              </div>

              <p style="margin: 15px 0 0; font-size: 12px; line-height: 1.5; color: #666158;">
                If you did not request a password reset, please disregard this email. Your existing password will remain active and secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #0e0e0e; border-top: 1px solid #262118; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #666158;">
                &copy; ${new Date().getFullYear()} JurisFlow. Your Legal World, Organized in One Flow.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
JurisFlow — Password Reset Verification Code

A password reset request was initiated for your JurisFlow account.

Your 6-Digit Verification Code: ${otp}

NOTE: This code is valid for 10 minutes. 

If you did not request this password reset, please ignore this email. Your account remains secure.

© ${new Date().getFullYear()} JurisFlow. Your Legal World, Organized in One Flow.
    `.trim();

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `JurisFlow — Password Reset Code: ${otp}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[Email Service] Password reset OTP sent successfully to ${toEmail}. MessageId: ${info.messageId}`);
    console.log(`[Email Service SMTP Response] Accepted: ${JSON.stringify(info.accepted)}, Response: "${info.response}"`);
    return { success: true, messageId: info.messageId, response: info.response, envelope: info.envelope };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send OTP email to ${toEmail}:`, {
      message: error.message,
      code: error.code,
      response: error.response,
      command: error.command,
      responseCode: error.responseCode,
      stack: error.stack,
    });
    return { success: false, error: error.message, code: error.code, response: error.response };
  }
};

/**
 * Sends a verified UPI payment confirmation email to the user
 * Styled with JurisFlow's Executive Dark & Gold aesthetic
 */
export const sendPaymentConfirmationEmail = async ({
  toEmail,
  userName = 'Valued Member',
  amount,
  utrNumber,
  status = 'verified',
  verifiedAt = new Date().toISOString(),
  advocateName = 'JurisFlow Platform Services',
  purpose = 'Legal Consultation / Retainer Service',
}) => {
  try {
    const transporter = getTransporter(true);
    const appUrl = resolveAppUrl();
    let cleanUser = (process.env.EMAIL_USER || '').trim();
    if (/@gamil\.com$/i.test(cleanUser)) {
      cleanUser = cleanUser.replace(/@gamil\.com$/i, '@gmail.com');
    }
    const fromAddress = cleanUser
      ? `"JurisFlow Payments" <${cleanUser}>`
      : '"JurisFlow Payments" <no-reply@jurisflow.com>';

    if (!transporter) {
      console.warn(
        `[Email Service] SMTP credentials not configured. Payment confirmation for UTR ${utrNumber} was not dispatched via SMTP.`
      );
      return { success: false, skipped: true, message: 'SMTP not configured' };
    }

    const formattedAmount = Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const dateFormatted = new Date(verifiedAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation — JurisFlow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080808; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5e6c4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080808; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #121212; border: 1px solid #262118; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
          <!-- Header Bar -->
          <tr>
            <td style="padding: 35px 40px 25px; text-align: center; border-bottom: 1px solid #262118; background: linear-gradient(180deg, #181818 0%, #121212 100%);">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: #1c1c1c; border: 1px solid #d4af37; text-align: center; margin-bottom: 12px;">
                <span style="font-size: 24px; color: #d4af37;">⚖️</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">JurisFlow</h1>
              <p style="margin: 6px 0 0; font-size: 13px; font-weight: 600; color: #d4af37;">Payment Receipt & Verification Confirmed</p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 35px 40px 25px;">
              <div style="text-align: center; margin-bottom: 25px;">
                <div style="display: inline-block; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 30px; padding: 6px 18px; margin-bottom: 15px;">
                  <span style="color: #10b981; font-size: 12px; font-weight: 800; letter-spacing: 0.5px;">✓ PAYMENT VERIFIED</span>
                </div>
                <div style="font-size: 36px; font-weight: 900; color: #d4af37; letter-spacing: -1px;">₹${formattedAmount}</div>
                <div style="font-size: 12px; color: #a39e93; margin-top: 4px;">Direct UPI Payment to 7558343192-1@nyes</div>
              </div>

              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #f5e6c4;">
                Dear <strong>${escapeHtml(userName)}</strong>,<br>
                Your direct UPI payment has been successfully verified by JurisFlow. The details of your transaction are summarized below:
              </p>

              <!-- Transaction Breakdown -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0; background: #181818; border: 1px solid #262118; border-radius: 12px;">
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #262118; font-size: 12px; color: #a39e93;">12-Digit UTR Number</td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #262118; font-size: 13px; font-weight: 700; color: #ffffff; text-align: right; font-family: monospace;">${escapeHtml(utrNumber)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #262118; font-size: 12px; color: #a39e93;">Payee UPI ID</td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #262118; font-size: 12px; font-weight: 700; color: #d4af37; text-align: right;">7558343192-1@nyes (JurisFlow)</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #262118; font-size: 12px; color: #a39e93;">Advocate / Service</td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #262118; font-size: 12px; font-weight: 600; color: #ffffff; text-align: right;">${escapeHtml(advocateName)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 12px; color: #a39e93;">Verified On</td>
                  <td style="padding: 12px 18px; font-size: 12px; color: #f5e6c4; text-align: right;">${dateFormatted}</td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0 10px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/client/dashboard" target="_blank" style="display: inline-block; background: #d4af37; color: #080808; font-size: 13px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 12px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                      Open JurisFlow Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 22px 40px; background-color: #0e0e0e; border-top: 1px solid #262118; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #666158; line-height: 1.5;">
                This is an official transactional receipt generated by JurisFlow.<br>
                &copy; ${new Date().getFullYear()} JurisFlow. Your Legal World, Organized in One Flow.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
JurisFlow — Payment Receipt & Verification Confirmed

Dear ${userName},

Your direct UPI payment of ₹${formattedAmount} has been verified successfully.

Transaction Details:
- 12-Digit UTR: ${utrNumber}
- Payee UPI ID: 7558343192-1@nyes (JurisFlow)
- Advocate / Service: ${advocateName}
- Verified On: ${dateFormatted}
- Status: VERIFIED & CONFIRMED

View your dashboard: ${appUrl}/client/dashboard

© ${new Date().getFullYear()} JurisFlow. Your Legal World, Organized in One Flow.
    `.trim();

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `JurisFlow Payment Verified — ₹${formattedAmount} (UTR: ${utrNumber})`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[Email Service] Payment confirmation email dispatched to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId, response: info.response };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send payment confirmation email to ${toEmail}:`, {
      message: error.message,
      code: error.code,
      response: error.response,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Consultation Accepted Notification Email (Dispatched to Client when Advocate Accepts)
 */
export const sendConsultationAcceptedEmail = async ({
  toEmail,
  userName = 'Valued Client',
  advocateName = 'Verified Advocate',
  channel = 'Chat',
  durationMins = 15,
  amount = 499,
  bookingId,
}) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[Email Service] Transporter not ready; skipping consultation accepted email.');
    return { success: false, skipped: true };
  }

  const rawUser = process.env.EMAIL_USER || 'jurisflow03@gmail.com';
  let cleanUser = rawUser.trim();
  if (/@gamil\.com$/i.test(cleanUser)) cleanUser = cleanUser.replace(/@gamil\.com$/i, '@gmail.com');
  const fromAddress = `"JurisFlow Consultations" <${cleanUser}>`;
  const appUrl = resolveAppUrl();
  const paymentLink = `${appUrl}/consultation/${channel.toLowerCase()}/${bookingId}?pay=true`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #080808; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080808; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #121212; border: 1px solid #262118; border-radius: 20px; overflow: hidden;">
          <tr>
            <td style="padding: 30px; text-align: center; border-bottom: 1px solid #262118;">
              <span style="font-size: 32px;">⚖️</span>
              <h2 style="color: #ffffff; margin: 10px 0 4px; font-size: 20px; font-weight: 900;">Consultation Request Accepted</h2>
              <p style="color: #d4af37; font-size: 13px; font-weight: 700; margin: 0;">Next Step: Complete Direct UPI Payment</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px 30px; color: #f5e6c4; font-size: 13px; line-height: 1.6;">
              <p style="margin-top: 0;">Dear <strong>${escapeHtml(userName)}</strong>,</p>
              <p>Advocate <strong>${escapeHtml(advocateName)}</strong> has accepted your request for an <strong>Instant ${escapeHtml(channel.toUpperCase())}</strong> consultation (${durationMins} minutes).</p>
              
              <div style="background: #181818; border: 1px solid #262118; border-radius: 12px; padding: 15px; margin: 20px 0;">
                <div style="margin-bottom: 8px;">
                  <span style="color: #a39e93;">Session Fee:</span>
                  <strong style="color: #d4af37; font-size: 16px; float: right;">₹${Number(amount).toFixed(2)}</strong>
                </div>
                <div style="margin-bottom: 8px; clear: both;">
                  <span style="color: #a39e93;">Consultation Mode:</span>
                  <strong style="color: #ffffff; float: right;">${escapeHtml(channel.toUpperCase())} (${durationMins} Mins)</strong>
                </div>
                <div style="clear: both;">
                  <span style="color: #a39e93;">Advocate:</span>
                  <strong style="color: #ffffff; float: right;">${escapeHtml(advocateName)}</strong>
                </div>
                <div style="clear: both;"></div>
              </div>

              <p style="color: #a39e93; font-size: 12px;">Your payment will be held securely in JurisFlow Escrow and only released once the consultation is completed.</p>

              <div style="text-align: center; margin: 25px 0 10px;">
                <a href="${paymentLink}" style="display: inline-block; background: #d4af37; color: #080808; font-size: 13px; font-weight: 800; text-decoration: none; padding: 14px 30px; border-radius: 12px;">
                  Pay ₹${Number(amount).toFixed(2)} via UPI & Start Session
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; background: #0a0a0a; border-top: 1px solid #262118; text-align: center; color: #666158; font-size: 11px;">
              &copy; ${new Date().getFullYear()} JurisFlow • Direct UPI Escrow System
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Adv. ${advocateName} Accepted Your Request — Complete Payment to Connect`,
      text: `Adv. ${advocateName} accepted your consultation request. Pay ₹${amount} via UPI to join: ${paymentLink}`,
      html: htmlContent,
    });
    console.log(`[Email Service] Consultation accepted email sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Service Error] Failed to send accepted email to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Escrow Payout Released Notification Email (Dispatched to Advocate when Consultation Completes)
 */
export const sendEscrowPayoutReleasedEmail = async ({
  toEmail,
  advocateName = 'Advocate',
  clientName = 'Client',
  grossAmount,
  platformCommission,
  netAmount,
}) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[Email Service] Transporter not ready; skipping escrow release email.');
    return { success: false, skipped: true };
  }

  const rawUser = process.env.EMAIL_USER || 'jurisflow03@gmail.com';
  let cleanUser = rawUser.trim();
  if (/@gamil\.com$/i.test(cleanUser)) cleanUser = cleanUser.replace(/@gamil\.com$/i, '@gmail.com');
  const fromAddress = `"JurisFlow Settlements" <${cleanUser}>`;
  const appUrl = resolveAppUrl();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #080808; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080808; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #121212; border: 1px solid #262118; border-radius: 20px; overflow: hidden;">
          <tr>
            <td style="padding: 30px; text-align: center; border-bottom: 1px solid #262118;">
              <span style="font-size: 32px;">💰</span>
              <h2 style="color: #ffffff; margin: 10px 0 4px; font-size: 20px; font-weight: 900;">Consultation Fee Released from Escrow</h2>
              <p style="color: #10b981; font-size: 13px; font-weight: 700; margin: 0;">Credited to Your JurisFlow Wallet Balance</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px 30px; color: #f5e6c4; font-size: 13px; line-height: 1.6;">
              <p style="margin-top: 0;">Dear <strong>${escapeHtml(advocateName)}</strong>,</p>
              <p>Your legal consultation with client <strong>${escapeHtml(clientName)}</strong> has been concluded. The held consultation fee has been released from escrow into your available balance.</p>
              
              <div style="background: #181818; border: 1px solid #262118; border-radius: 12px; padding: 15px; margin: 20px 0;">
                <div style="margin-bottom: 8px;">
                  <span style="color: #a39e93;">Gross Consultation Fee:</span>
                  <strong style="color: #ffffff; float: right;">₹${Number(grossAmount).toFixed(2)}</strong>
                </div>
                <div style="margin-bottom: 8px; clear: both;">
                  <span style="color: #a39e93;">Platform Commission (15%):</span>
                  <span style="color: #f87171; float: right;">-₹${Number(platformCommission).toFixed(2)}</span>
                </div>
                <div style="border-top: 1px solid #262118; padding-top: 8px; clear: both;">
                  <strong style="color: #f5e6c4;">Net Credited to Balance:</strong>
                  <strong style="color: #d4af37; font-size: 16px; float: right;">₹${Number(netAmount).toFixed(2)}</strong>
                </div>
                <div style="clear: both;"></div>
              </div>

              <div style="text-align: center; margin: 25px 0 10px;">
                <a href="${appUrl}/lawyer/dashboard" style="display: inline-block; background: #d4af37; color: #080808; font-size: 13px; font-weight: 800; text-decoration: none; padding: 14px 30px; border-radius: 12px;">
                  View Payout Balance & Ledger
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; background: #0a0a0a; border-top: 1px solid #262118; text-align: center; color: #666158; font-size: 11px;">
              &copy; ${new Date().getFullYear()} JurisFlow • Institutional Legal Governance
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `JurisFlow Escrow Released: ₹${Number(netAmount).toFixed(2)} Credited for Consultation`,
      text: `Escrow fee released: ₹${netAmount} credited to your JurisFlow balance. View: ${appUrl}/lawyer/dashboard`,
      html: htmlContent,
    });
    console.log(`[Email Service] Escrow release email dispatched to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Service Error] Failed to send escrow release email to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Escapes HTML characters for safe template rendering
 */
function escapeHtml(string) {
  if (typeof string !== 'string') return '';
  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default {
  createFreshTransporter,
  getTransporter,
  sendWelcomeEmail,
  sendOtpEmail,
  sendPaymentConfirmationEmail,
  sendConsultationAcceptedEmail,
  sendEscrowPayoutReleasedEmail,
  resolveAppUrl,
};
