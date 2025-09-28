import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import ForgetPasswordEmail from '../emails/auth/forget-password';

export interface EmailServiceConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
}

export interface PasswordResetEmailParams {
  to: string;
  userName: string;
  resetUrl: string;
  token: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export abstract class EmailService {
  private static config: EmailServiceConfig | null = null;
  private static transporter: nodemailer.Transporter | null = null;

  static initialize() {
    if (!this.config) {
      this.config = {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '1025'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
        from: {
          name: process.env.SMTP_FROM_NAME || 'MedWaster Learning',
          address: process.env.SMTP_FROM_ADDRESS || 'noreply@medwaster.com',
        },
      };

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
      });
    }
  }

  static async sendPasswordReset(params: PasswordResetEmailParams): Promise<EmailResult> {
    try {
      this.initialize();

      if (!this.transporter || !this.config) {
        throw new Error('Email service not properly initialized');
      }

      const emailHtml = await render(ForgetPasswordEmail({
        url: params.resetUrl,
        username: params.userName,
      }));

      const mailOptions = {
        from: `"${this.config.from.name}" <${this.config.from.address}>`,
        to: params.to,
        subject: 'Reset your password - MedWaster Learning',
        html: emailHtml,
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }

  static async validateConfiguration(): Promise<boolean> {
    try {
      this.initialize();
      
      if (!this.transporter) {
        return false;
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration validation failed:', error);
      return false;
    }
  }

  static async getDeliveryStatus(messageId: string): Promise<'pending' | 'delivered' | 'failed' | 'bounced'> {
    // This is a placeholder - in production you'd integrate with your email provider's API
    // For now, we'll assume successful delivery
    return 'delivered';
  }
}
