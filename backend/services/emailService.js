/**
 * Email Notification Service
 * Uses Nodemailer with Gmail SMTP or SendGrid
 * 
 * Environment Variables Required:
 * - EMAIL_SERVICE: 'gmail' or 'sendgrid'
 * - EMAIL_USER: Gmail address or SendGrid API key
 * - EMAIL_PASS: Gmail app password or SendGrid API key
 * - EMAIL_FROM: Sender email address
 */

const nodemailer = require('nodemailer');

// Email configuration from environment
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Studio Agents <noreply@studioagentsai.com>';

// Admin emails to notify
const ADMIN_NOTIFICATION_EMAILS = [
  'jari57@gmail.com',
  'info@studioagentsai.com'
];

// Create transporter based on service
let transporter = null;

const initializeTransporter = () => {
  if (transporter) return transporter;
  
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('[EmailService] Email credentials not configured - notifications disabled');
    return null;
  }

  if (EMAIL_SERVICE === 'sendgrid') {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: EMAIL_PASS
      }
    });
  } else {
    // Default to Gmail
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
  }

  console.log(`[EmailService] Initialized with ${EMAIL_SERVICE}`);
  return transporter;
};

// Email templates
const templates = {
  loginNotification: (userData) => ({
    subject: `🔐 New Login - Studio Agents`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #a855f7; margin: 0; font-size: 28px;">🎵 Studio Agents</h1>
          <p style="color: #9ca3af; margin-top: 8px;">Login Notification</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 20px;">New Login Detected</h2>
          
          <table style="width: 100%; color: #d1d5db; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Email:</td>
              <td style="padding: 8px 0; font-weight: 600;">${userData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">User ID:</td>
              <td style="padding: 8px 0; font-family: monospace;">${userData.uid}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Time:</td>
              <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">IP Address:</td>
              <td style="padding: 8px 0;">${userData.ip || 'Unknown'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Device:</td>
              <td style="padding: 8px 0;">${userData.userAgent || 'Unknown'}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
          This is an automated notification from Studio Agents.
        </p>
      </div>
    `
  }),

  projectCreated: (userData, projectData) => ({
    subject: `📁 New Project Created - ${projectData.name}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #a855f7; margin: 0; font-size: 28px;">🎵 Studio Agents</h1>
          <p style="color: #9ca3af; margin-top: 8px;">Project Created</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #22c55e; margin: 0 0 16px 0; font-size: 20px;">✨ New Project Created</h2>
          
          <table style="width: 100%; color: #d1d5db; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Project Name:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #a855f7;">${projectData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Category:</td>
              <td style="padding: 8px 0;">${projectData.category || 'General'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Created By:</td>
              <td style="padding: 8px 0;">${userData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">User ID:</td>
              <td style="padding: 8px 0; font-family: monospace;">${userData.uid}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Created At:</td>
              <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
          This is an automated notification from Studio Agents.
        </p>
      </div>
    `
  }),

  projectDeleted: (userData, projectData) => ({
    subject: `🗑️ Project Deleted - ${projectData.name}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #a855f7; margin: 0; font-size: 28px;">🎵 Studio Agents</h1>
          <p style="color: #9ca3af; margin-top: 8px;">Project Deleted</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #ef4444; margin: 0 0 16px 0; font-size: 20px;">🗑️ Project Deleted</h2>
          
          <table style="width: 100%; color: #d1d5db; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Project Name:</td>
              <td style="padding: 8px 0; font-weight: 600;">${projectData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Project ID:</td>
              <td style="padding: 8px 0; font-family: monospace;">${projectData.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Deleted By:</td>
              <td style="padding: 8px 0;">${userData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Deleted At:</td>
              <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
          This is an automated notification from Studio Agents.
        </p>
      </div>
    `
  }),

  welcomeEmail: (userData) => ({
    subject: `🎉 Welcome to Studio Agents!`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #a855f7; margin: 0; font-size: 32px;">🎵 Studio Agents</h1>
          <p style="color: #22c55e; margin-top: 8px; font-size: 18px;">Welcome to the Future of Music Creation</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 24px;">Hey ${userData.displayName || 'Creator'}! 🎤</h2>
          
          <p style="color: #d1d5db; line-height: 1.6; margin-bottom: 20px;">
            Welcome to Studio Agents - your AI-powered music production studio. You now have access to 16 specialized AI agents that can help you create, produce, and release your music.
          </p>
          
          <div style="background: rgba(168, 85, 247, 0.1); border-left: 4px solid #a855f7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #a855f7; margin: 0 0 8px 0;">🎁 Your Starter Credits</h3>
            <p style="color: #d1d5db; margin: 0;">You've received <strong style="color: #22c55e;">3 free credits</strong> to explore the platform!</p>
          </div>
          
          <h3 style="color: #ffffff; margin: 20px 0 12px 0;">Quick Start Guide:</h3>
          <ul style="color: #d1d5db; line-height: 1.8; padding-left: 20px;">
            <li>🎤 <strong>Ghostwriter</strong> - Generate lyrics and hooks</li>
            <li>📊 <strong>Release Strategist</strong> - Plan your release</li>
            <li>🎨 <strong>Visual Director</strong> - Create album artwork concepts</li>
            <li>📱 <strong>Brand Architect</strong> - Build your artist brand</li>
          </ul>
          
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://studioagentsai.com" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
              Open Studio →
            </a>
          </div>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
          Questions? Reply to this email or visit our support center.<br>
          © 2026 Studio Agents AI. All rights reserved.
        </p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  const transport = initializeTransporter();
  
  if (!transport) {
    console.warn(`[EmailService] Email not sent (disabled): ${template}`);
    return { success: false, reason: 'Email service not configured' };
  }

  try {
    const emailContent = templates[template];
    if (!emailContent) {
      throw new Error(`Unknown email template: ${template}`);
    }

    const { subject, html } = typeof emailContent === 'function' ? emailContent(data, data.projectData) : emailContent;

    const mailOptions = {
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html
    };

    const result = await transport.sendMail(mailOptions);
    console.log(`[EmailService] ✅ Email sent: ${template} to ${to}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`[EmailService] ❌ Failed to send email: ${template}`, error.message);
    return { success: false, error: error.message };
  }
};

// Notify admins function
const notifyAdmins = async (template, data) => {
  return sendEmail(ADMIN_NOTIFICATION_EMAILS, template, data);
};

// Notify user function
const notifyUser = async (userEmail, template, data) => {
  if (!userEmail) return { success: false, reason: 'No user email' };
  return sendEmail(userEmail, template, data);
};

module.exports = {
  sendEmail,
  notifyAdmins,
  notifyUser,
  templates,
  ADMIN_NOTIFICATION_EMAILS
};
