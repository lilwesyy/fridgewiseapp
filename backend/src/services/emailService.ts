import nodemailer from 'nodemailer';

interface EmailConfig {
  service: string;
  user: string;
  password: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    
    if (emailService === 'smtp') {
      // Custom SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });
    } else {
      // Predefined service (gmail, yahoo, etc.)
      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  }

  async sendPasswordResetCode(email: string, resetCode: string): Promise<void> {
    const fromName = process.env.EMAIL_FROM_NAME || 'FridgeWise';
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;
    
    const mailOptions = {
      from: `${fromName} <${fromAddress}>`,
      to: email,
      subject: 'FridgeWise - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin-bottom: 10px;">FridgeWise</h1>
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
              You have requested to reset your password. Use the following code to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #16a34a; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
                ${resetCode}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              This code will expire in <strong>10 minutes</strong> for security reasons.
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px;">
              This is an automated email from FridgeWise. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendEmailVerificationCode(email: string, verificationCode: string): Promise<void> {
    const fromName = process.env.EMAIL_FROM_NAME || 'FridgeWise';
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;
    
    const mailOptions = {
      from: `${fromName} <${fromAddress}>`,
      to: email,
      subject: 'FridgeWise - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin-bottom: 10px;">🍽️ FridgeWise</h1>
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
          </div>
          
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Welcome to FridgeWise! To complete your registration, please verify your email address using the code below:
            </p>
            
            <div style="background-color: #16a34a; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; margin-bottom: 10px;">Your Verification Code</p>
              <h1 style="margin: 0; font-size: 36px; letter-spacing: 4px; font-weight: bold;">${verificationCode}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 0;">
              This code will expire in <strong>10 minutes</strong>. Enter it in the app to verify your email address.
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>Security Notice:</strong> If you didn't create an account with FridgeWise, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px;">
              This is an automated email from FridgeWise. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();