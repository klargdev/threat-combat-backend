const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate password reset token
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Send email verification
const sendEmailVerification = async (email, token, name) => {
  try {
    const transporter = createTransporter();
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    const mailOptions = {
      from: `"Threat Combat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - Threat Combat",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Threat Combat</h1>
            <p style="margin: 10px 0 0 0;">Cybersecurity Education & Research Platform</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to Threat Combat, ${name}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thank you for joining our cybersecurity community. To complete your registration and start exploring our platform, please verify your email address.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block; 
                        font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                This link will expire in 24 hours. If you didn't create an account with Threat Combat, please ignore this email.
              </p>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 Threat Combat. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email verification sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email verification error:", error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, name) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const mailOptions = {
      from: `"Threat Combat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password - Threat Combat",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Threat Combat</h1>
            <p style="margin: 10px 0 0 0;">Password Reset Request</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset your password for your Threat Combat account. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block; 
                        font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
            </p>
            
            <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 Threat Combat. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Password reset email error:", error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name, chapter) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Threat Combat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Threat Combat! 🚀",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Welcome to Threat Combat! 🚀</h1>
            <p style="margin: 10px 0 0 0;">Your cybersecurity journey begins now</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Welcome to Threat Combat! You're now part of a growing community of cybersecurity professionals and enthusiasts across Africa.
            </p>
            
            ${chapter ? `
            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #2d5a2d; margin: 0;">
                <strong>Your Chapter:</strong> ${chapter.name} at ${chapter.university}
              </p>
            </div>
            ` : ''}
            
            <h3 style="color: #333; margin: 25px 0 15px 0;">What's Next?</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Complete your profile with your skills and interests</li>
              <li>Join research projects and collaborate with peers</li>
              <li>Participate in training courses and certifications</li>
              <li>Connect with industry professionals</li>
              <li>Join competitions and CTF challenges</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block; 
                        font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 Threat Combat. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Welcome email error:", error);
    return { success: false, error: error.message };
  }
};

// Send account activation notification
const sendAccountActivationEmail = async (email, name, activatedBy) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Threat Combat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Account Activated - Threat Combat",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Account Activated! ✅</h1>
            <p style="margin: 10px 0 0 0;">Welcome to Threat Combat</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Great news! Your Threat Combat account has been activated by ${activatedBy}. You can now access all features of our platform.
            </p>
            
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #155724; margin: 0;">
                <strong>Status:</strong> Your account is now active and ready to use!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block; 
                        font-weight: bold;">
                Login to Your Account
              </a>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 Threat Combat. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Account activation email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Account activation email error:", error);
    return { success: false, error: error.message };
  }
};

// Send account suspension notification
const sendAccountSuspensionEmail = async (email, name, reason) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Threat Combat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Account Suspended - Threat Combat",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Account Suspended ⚠️</h1>
            <p style="margin: 10px 0 0 0;">Action Required</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Your Threat Combat account has been temporarily suspended. Please review the details below.
            </p>
            
            <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #721c24; margin: 0;">
                <strong>Reason:</strong> ${reason || "Policy violation"}
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you believe this suspension was made in error, please contact your chapter administrator or our support team.
            </p>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 Threat Combat. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Account suspension email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Account suspension email error:", error);
    return { success: false, error: error.message };
  }
};

// Send role assignment notification
const sendRoleAssignmentNotification = async (email, name, newRole, chapterName) => {
  try {
    const roleTitle = newRole === 'super_admin' ? 'Super Administrator' : 'Chapter Administrator';
    const subject = `Role Assignment - ${roleTitle}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎯 Threat Combat</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Role Assignment Notification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Congratulations, ${name}! 🎉</h2>
          
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0;">Your Role Has Been Updated</h3>
            <p style="color: #666; line-height: 1.6;">
              You have been assigned the role of <strong>${roleTitle}</strong> in the Threat Combat platform.
              ${chapterName ? `You will be managing the <strong>${chapterName}</strong> chapter.` : ''}
            </p>
          </div>
          
          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #2c5aa0; margin-top: 0;">🔑 New Responsibilities:</h4>
            <ul style="color: #555; line-height: 1.6;">
              ${newRole === 'super_admin' ? `
                <li>Manage all Threat Combat chapters and users</li>
                <li>Assign chapter administrators</li>
                <li>Oversee platform-wide activities and policies</li>
                <li>Access to all system features and analytics</li>
              ` : `
                <li>Manage ${chapterName} chapter members and activities</li>
                <li>Approve new member applications</li>
                <li>Organize chapter events and training sessions</li>
                <li>Coordinate with Threat Combat HQ</li>
              `}
            </ul>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #856404; margin-top: 0;">⚠️ Important Next Steps:</h4>
            <ol style="color: #856404; line-height: 1.6;">
              <li>Log in to your Threat Combat account</li>
              <li>Review your new permissions and features</li>
              <li>Complete the administrator orientation (if applicable)</li>
              <li>Contact Threat Combat HQ if you have any questions</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              Access Dashboard
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 14px;">
              If you have any questions, please contact us at 
              <a href="mailto:info@threatcombatgh.com" style="color: #667eea;">info@threatcombatgh.com</a>
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              Threat Combat - Your Cybersecurity Partner for Incident Response and Digital Forensics
            </p>
          </div>
        </div>
      </div>
    `;

    const result = await sendEmail(email, subject, htmlContent);
    return result;

  } catch (error) {
    console.error('Role assignment notification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateVerificationToken,
  generatePasswordResetToken,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccountActivationEmail,
  sendAccountSuspensionEmail,
  sendRoleAssignmentNotification
};
