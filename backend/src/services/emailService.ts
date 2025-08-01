import nodemailer from 'nodemailer';
import { generatePasswordResetEmail, generateEmailVerificationEmail, SupportedLocale } from '../utils/emailLocalization';

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

  async sendPasswordResetCode(email: string, resetCode: string, locale: SupportedLocale = 'en'): Promise<void> {
    const fromName = process.env.EMAIL_FROM_NAME || 'FridgeWiseAI';
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;
    
    const emailContent = generatePasswordResetEmail(resetCode, locale);
    
    const mailOptions = {
      from: `${fromName} <${fromAddress}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendEmailVerificationCode(email: string, verificationCode: string, locale: SupportedLocale = 'en'): Promise<void> {
    const fromName = process.env.EMAIL_FROM_NAME || 'FridgeWiseAI';
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;
    
    const emailContent = generateEmailVerificationEmail(verificationCode, locale);
    
    const mailOptions = {
      from: `${fromName} <${fromAddress}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html
    };

    await this.transporter.sendMail(mailOptions);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.log('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();