import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface BugReportAttachment {
  filename: string;
  contentType: string;
  data: string; // base64 encoded
}

export interface BugReportPayload {
  name?: string;
  email?: string;
  category: string;
  title: string;
  description: string;
  stepsToReproduce?: string;
  attachments?: BugReportAttachment[];
  ipAddress?: string;
  userAgent?: string;
}

export interface EmailSendResult {
  success: boolean;
  reportId: string;
  messageId?: string;
  previewUrl?: string | null;
  deliveredTo: string;
  mode: 'smtp' | 'test-ethereal' | 'unconfigured';
  error?: string;
}

// Global cached test transporter for development if live SMTP is not set
let cachedTestTransporter: Transporter | null = null;

// Simple in-memory rate limiter: IP -> timestamps array
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

// Clean old rate limit entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, valid);
    }
  }
}, 30 * 60 * 1000);

// HTML escaping utility to prevent XSS in email clients
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Sanitize single-line text for email headers (prevent CRLF header injection)
function sanitizeHeader(text?: string): string {
  if (!text) return '';
  return text.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Creates and verifies the nodemailer transporter
 */
async function getEmailTransporter(): Promise<{ transporter: Transporter | null; mode: 'smtp' | 'test-ethereal' | 'unconfigured' }> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpService = process.env.SMTP_SERVICE;
  const resendApiKey = process.env.RESEND_API_KEY;

  // Case 1: Custom or standard SMTP credentials provided
  if (smtpUser && smtpPass) {
    const isGmail = smtpService?.toLowerCase() === 'gmail' || smtpUser.includes('@gmail.com');
    const port = Number(process.env.SMTP_PORT) || (isGmail ? 465 : 587);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    const config: any = isGmail && !smtpHost
      ? {
          service: 'gmail',
          auth: { user: smtpUser, pass: smtpPass }
        }
      : {
          host: smtpHost || (resendApiKey ? 'smtp.resend.com' : 'smtp.gmail.com'),
          port,
          secure,
          auth: { user: smtpUser, pass: smtpPass }
        };

    const transporter = nodemailer.createTransport(config);
    return { transporter, mode: 'smtp' };
  }

  // Case 2: Resend API Key without explicit SMTP_USER
  if (resendApiKey && !smtpUser) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: resendApiKey
      }
    });
    return { transporter, mode: 'smtp' };
  }

  // Case 3: Development mode without live credentials -> Auto-create Ethereal test account
  if (process.env.NODE_ENV !== 'production') {
    if (!cachedTestTransporter) {
      try {
        console.log('[EmailService] Initializing Ethereal test mailer for development/testing...');
        const testAccount = await nodemailer.createTestAccount();
        cachedTestTransporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log(`[EmailService] Ethereal test account ready: ${testAccount.user}`);
      } catch (err: any) {
        console.error('[EmailService] Failed to create Ethereal test account:', err.message);
        return { transporter: null, mode: 'unconfigured' };
      }
    }
    return { transporter: cachedTestTransporter, mode: 'test-ethereal' };
  }

  // Case 4: Production on Render with missing SMTP credentials
  return { transporter: null, mode: 'unconfigured' };
}

/**
 * Validates the bug report payload
 */
export function validateBugReport(payload: any): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid bug report submission payload.' };
  }

  const { title, description, category, email, name, attachments } = payload;

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return { valid: false, error: 'Please provide a descriptive Bug Title (at least 3 characters).' };
  }
  if (title.trim().length > 150) {
    return { valid: false, error: 'Bug Title must be under 150 characters.' };
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return { valid: false, error: 'Please provide a Detailed Description of the issue (at least 10 characters).' };
  }
  if (description.trim().length > 5000) {
    return { valid: false, error: 'Bug Description must be under 5000 characters.' };
  }

  if (email && typeof email === 'string' && email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim()) || email.trim().length > 120) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
  }

  if (name && typeof name === 'string' && name.trim().length > 100) {
    return { valid: false, error: 'Name must be under 100 characters.' };
  }

  if (attachments && Array.isArray(attachments)) {
    if (attachments.length > 3) {
      return { valid: false, error: 'A maximum of 3 attachments are allowed per bug report.' };
    }
    for (const att of attachments) {
      if (!att.filename || !att.data) {
        return { valid: false, error: 'Invalid attachment data.' };
      }
      // Check approximate size (base64 size ~ 1.37 * binary size; 5MB = ~6.8MB base64)
      if (att.data.length > 7 * 1024 * 1024) {
        return { valid: false, error: `Attachment "${att.filename}" exceeds the maximum allowed file size of 5MB.` };
      }
    }
  }

  return { valid: true };
}

/**
 * Sends a bug report email
 */
export async function sendBugReportEmail(payload: BugReportPayload): Promise<EmailSendResult> {
  const reportId = `ACE-BUG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const designatedRecipient = process.env.BUG_REPORT_RECIPIENT_EMAIL || 'arhamahmad15900@gmail.com';
  const submissionTimestamp = new Date().toISOString();
  const formattedDate = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  const { transporter, mode } = await getEmailTransporter();

  // If in production and SMTP credentials are not yet configured in Render
  if (!transporter || mode === 'unconfigured') {
    const missingVars = [];
    if (!process.env.SMTP_USER) missingVars.push('SMTP_USER');
    if (!process.env.SMTP_PASS && !process.env.RESEND_API_KEY) missingVars.push('SMTP_PASS');

    console.error(`[EmailService] ❌ Bug report ${reportId} rejected: Email service is not configured in Render.`);
    console.error(`[EmailService] Missing required environment variables: ${missingVars.join(', ')}`);
    console.error(`[EmailService] Recipient intended: ${designatedRecipient}`);

    return {
      success: false,
      reportId,
      deliveredTo: designatedRecipient,
      mode: 'unconfigured',
      error: 'Email delivery is currently not configured on this server. Please ensure SMTP_USER and SMTP_PASS are set in your Render environment variables.'
    };
  }

  // Format email sender and reply-to
  const senderAddress = process.env.SMTP_FROM || 
    (process.env.SMTP_USER ? `"Access CBT Bug Tracker" <${process.env.SMTP_USER}>` : '"Access CBT Portal" <noreply@accesscbt.org>');
  
  const cleanTitle = sanitizeHeader(payload.title);
  const cleanCategory = sanitizeHeader(payload.category);
  const cleanName = sanitizeHeader(payload.name) || 'Anonymous Visitor';
  const cleanUserEmail = sanitizeHeader(payload.email);

  const subject = `[Bug Report #${reportId}] ${cleanCategory}: ${cleanTitle}`;

  // Process attachments
  const mailAttachments = (payload.attachments || []).map((att, idx) => {
    const cleanFilename = att.filename.replace(/[^a-zA-Z0-9._-]/g, '_') || `screenshot_${idx + 1}.png`;
    return {
      filename: cleanFilename,
      content: Buffer.from(att.data, 'base64'),
      contentType: att.contentType || 'image/png'
    };
  });

  // Plain-text alternative
  const textContent = `
=============================================================
ACCESS COMPUTER EDUCATION CENTER - CBT PORTAL BUG REPORT
=============================================================
Report ID: ${reportId}
Date & Time: ${formattedDate} (IST) / ${submissionTimestamp} (UTC)
Category: ${cleanCategory}
Title: ${cleanTitle}

REPORTER INFORMATION:
- Name: ${cleanName}
- Contact Email: ${cleanUserEmail || 'None provided'}
- Client IP: ${payload.ipAddress || 'Not recorded'}

BUG DESCRIPTION:
${payload.description}

STEPS TO REPRODUCE:
${payload.stepsToReproduce || 'None provided'}

ATTACHMENTS:
${mailAttachments.length > 0 ? mailAttachments.map(a => `- ${a.filename} (${a.contentType})`).join('\n') : 'No attachments provided'}

=============================================================
This is an automated notification from Access Computer Education Center CBT Platform.
Recipient: ${designatedRecipient}
=============================================================
  `.trim();

  // HTML formatted template with Access Computer Education Center branding
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7fb; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #02529c 0%, #003366 100%); color: #ffffff; padding: 24px 28px; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #93c5fd; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid #fde68a; margin-top: 10px; }
    .body { padding: 28px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .info-table td.label { font-weight: 600; color: #64748b; width: 30%; background: #f8fafc; }
    .info-table td.value { color: #0f172a; font-weight: 500; }
    .section-title { font-size: 14px; font-weight: 700; color: #02529c; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 14px; color: #334155; white-space: pre-wrap; word-break: break-word; }
    .attachment-badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; margin: 4px 4px 4px 0; border: 1px solid #bae6fd; }
    .footer { background: #f8fafc; padding: 18px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    .footer a { color: #02529c; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Access Computer Education Center</h1>
      <p>CBT Examination Portal • Bug Reporting Notification</p>
      <div class="badge">Report ID: ${reportId}</div>
    </div>

    <div class="body">
      <h2 style="margin: 0 0 16px; font-size: 18px; color: #0f172a; font-weight: 700;">
        ${escapeHtml(cleanTitle)}
      </h2>

      <table class="info-table">
        <tr>
          <td class="label">Category</td>
          <td class="value"><strong style="color: #b45309;">${escapeHtml(cleanCategory)}</strong></td>
        </tr>
        <tr>
          <td class="label">Reported By</td>
          <td class="value">${escapeHtml(cleanName)}</td>
        </tr>
        <tr>
          <td class="label">Contact Email</td>
          <td class="value">
            ${cleanUserEmail 
              ? `<a href="mailto:${escapeHtml(cleanUserEmail)}" style="color: #02529c; font-weight: 600;">${escapeHtml(cleanUserEmail)}</a>` 
              : '<em style="color: #94a3b8;">None provided</em>'}
          </td>
        </tr>
        <tr>
          <td class="label">Date & Time</td>
          <td class="value">${escapeHtml(formattedDate)}</td>
        </tr>
        <tr>
          <td class="label">Client IP</td>
          <td class="value"><code style="font-size: 11px; background: #e2e8f0; padding: 2px 5px; rounded: 3px;">${escapeHtml(payload.ipAddress || 'Not recorded')}</code></td>
        </tr>
      </table>

      <div class="section-title">Detailed Description</div>
      <div class="box">${escapeHtml(payload.description)}</div>

      ${payload.stepsToReproduce ? `
        <div class="section-title">Steps to Reproduce</div>
        <div class="box">${escapeHtml(payload.stepsToReproduce)}</div>
      ` : ''}

      ${mailAttachments.length > 0 ? `
        <div class="section-title">Attached Screenshots (${mailAttachments.length})</div>
        <div>
          ${mailAttachments.map(a => `<span class="attachment-badge">📎 ${escapeHtml(a.filename)}</span>`).join('')}
        </div>
        <p style="font-size: 11px; color: #64748b; margin-top: 6px;">The screenshots have been attached directly to this email.</p>
      ` : ''}
    </div>

    <div class="footer">
      This is an automated notification delivered to <strong>${escapeHtml(designatedRecipient)}</strong> from the Access Computer Education Center CBT portal.<br>
      ${cleanUserEmail ? `To respond to the reporter, click Reply in your email client.` : ''}
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    console.log(`[EmailService] Sending bug report ${reportId} to ${designatedRecipient} via ${mode.toUpperCase()}...`);

    const mailOptions: any = {
      from: senderAddress,
      to: designatedRecipient,
      subject,
      text: textContent,
      html: htmlContent,
      attachments: mailAttachments
    };

    // If user provided a valid email address, set it as Reply-To
    if (cleanUserEmail) {
      mailOptions.replyTo = cleanUserEmail;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`[EmailService] ✓ Bug report ${reportId} successfully sent!`);
    console.log(`[EmailService] Message ID: ${info.messageId}`);

    let previewUrl: string | null = null;
    if (mode === 'test-ethereal') {
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
      console.log(`[EmailService] 🔗 Ethereal Test Mail Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      reportId,
      messageId: info.messageId,
      previewUrl,
      deliveredTo: designatedRecipient,
      mode
    };
  } catch (err: any) {
    console.error(`[EmailService] ❌ Failed to deliver bug report ${reportId}:`, err);
    return {
      success: false,
      reportId,
      deliveredTo: designatedRecipient,
      mode,
      error: `Email delivery failed: ${err.message || 'Unknown SMTP error'}`
    };
  }
}
