import nodemailer from "nodemailer";
import env from "../config/env";
import { OTPType } from "../constants/enums";
import logger from "../config/logger";
import { AppError } from "../utils/app-error";

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;

  private constructor() {
    this.initializeTransporter();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private initializeTransporter(): void {
    // Skip transporter creation if SMTP is not configured or in development without credentials
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      logger.warn('SMTP not configured. Email service will run in development mode (console only)');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        // Add connection timeout
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('SMTP connection failed:', error);
          this.transporter = null;
        } else {
          logger.info('SMTP server is ready to send emails');
        }
      });
    } catch (error) {
      logger.error('Failed to create email transporter:', error);
      this.transporter = null;
    }
  }

  private getEmailTemplate(
    otp: string,
    type: OTPType,
  ): { subject: string; html: string } {
    switch (type) {
      case OTPType.EMAIL_VERIFICATION:
        return {
          subject: "Verify Your Email - Social Media App",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h2 style="color: #333; text-align: center;">Welcome to Social Media App!</h2>
              <p style="color: #666;">Please verify your email address using the OTP below:</p>
              <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
                ${otp}
              </div>
              <p style="color: #666;">This OTP will expire in 10 minutes.</p>
              <p style="color: #999; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
            </div>
          `,
        };
      case OTPType.PASSWORD_RESET:
        return {
          subject: "Reset Your Password - Social Media App",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
              <p style="color: #666;">You requested to reset your password. Use the OTP below:</p>
              <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
                ${otp}
              </div>
              <p style="color: #666;">This OTP will expire in 10 minutes.</p>
              <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
          `,
        };
      default:
        return {
          subject: "Your OTP Code",
          html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
        };
    }
  }

  async sendOTP(email: string, otp: string, type: OTPType): Promise<void> {
    try {
      // Development mode: Log OTP to console
      if (env.NODE_ENV === 'development' && !this.transporter) {
        console.log('\n' + '='.repeat(60));
        console.log(` [DEV MODE] Email would be sent to: ${email}`);
        console.log(` Type: ${type}`);
        console.log(` OTP: ${otp}`);
        console.log(` Expires in: 10 minutes`);
        console.log('='.repeat(60) + '\n');
        
        logger.info(`[DEV MODE] OTP for ${email}: ${otp} (Type: ${type})`);
        return;
      }

      // Check if transporter is available
      if (!this.transporter) {
        throw new AppError('Email service is not configured. Please check SMTP settings in .env');
      }

      // Send real email
      const { subject, html } = this.getEmailTemplate(otp, type);

      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject,
        html,
      });

      logger.info(`OTP email sent to ${email} for type: ${type}`, {
        messageId: info.messageId,
        response: info.response,
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to send OTP email:", {
        error: err.message,
        email,
        type,
        stack: err.stack,
      });
      
      // In development, don't throw error if email fails
      if (env.NODE_ENV === 'development') {
        console.log('\n' + '='.repeat(60));
        console.log(`⚠️  Email sending failed, but continuing in development mode`);
        console.log(`📧 To: ${email}`);
        console.log(`🔐 OTP: ${otp}`);
        console.log(`📝 Type: ${type}`);
        console.log('='.repeat(60) + '\n');
        return;
      }
      
      throw new AppError("Failed to send OTP email. Please try again later.");
    }
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service configured successfully');
      return true;
    } catch (error) {
      const err = error as Error;
      console.error('❌ Email service configuration failed:', err.message);
      return false;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      // Development mode: Log email to console
      if (env.NODE_ENV === 'development' && !this.transporter) {
        console.log('\n' + '='.repeat(60));
        console.log(` [DEV MODE] Email would be sent to: ${to}`);
        console.log(` Subject: ${subject}`);
        console.log(` Content: ${html.substring(0, 100)}...`);
        console.log('='.repeat(60) + '\n');

        logger.info(`[DEV MODE] Email sent to ${to}: ${subject}`);
        return;
      }

      // Check if transporter is available
      if (!this.transporter) {
        throw new AppError('Email service is not configured. Please check SMTP settings in .env');
      }

      // Send real email
      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });

      logger.info(`Email sent to ${to}`, {
        messageId: info.messageId,
        response: info.response,
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to send email:", {
        error: err.message,
        to,
        subject,
        stack: err.stack,
      });

      // In development, don't throw error if email fails
      if (env.NODE_ENV === 'development') {
        console.log('\n' + '='.repeat(60));
        console.log(`⚠️  Email sending failed, but continuing in development mode`);
        console.log(`📧 To: ${to}`);
        console.log(`📝 Subject: ${subject}`);
        console.log('='.repeat(60) + '\n');
        return;
      }

      throw new AppError("Failed to send email. Please try again later.");
    }
  }
}

export default EmailService.getInstance();


// import nodemailer from "nodemailer";
// import env from "../config/env";
// import { OTPType } from "../constants/enums";
// import logger from "../config/logger";

// export class EmailService {
//   private static instance: EmailService;
//   private transporter: nodemailer.Transporter;

//   private constructor() {
//     this.transporter = nodemailer.createTransport({
//       host: env.SMTP_HOST,
//       port: env.SMTP_PORT,
//       secure: env.SMTP_PORT === 465,
//       auth: {
//         user: env.SMTP_USER,
//         pass: env.SMTP_PASS,
//       },
//     });
//   }

//   static getInstance(): EmailService {
//     if (!EmailService.instance) {
//       EmailService.instance = new EmailService();
//     }
//     return EmailService.instance;
//   }

//   private getEmailTemplate(
//     otp: string,
//     type: OTPType,
//   ): { subject: string; html: string } {
//     switch (type) {
//       case OTPType.EMAIL_VERIFICATION:
//         return {
//           subject: "Verify Your Email - social media app",
//           html: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//               <h2 style="color: #333;">Welcome to social media app!</h2>
//               <p>Please verify your email address using the OTP below:</p>
//               <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
//                 ${otp}
//               </div>
//               <p>This OTP will expire in 10 minutes.</p>
//               <p>If you didn't create an account, please ignore this email.</p>
//             </div>
//           `,
//         };
//       case OTPType.PASSWORD_RESET:
//         return {
//           subject: "Reset Your Password - social media app",
//           html: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//               <h2 style="color: #333;">Password Reset Request</h2>
//               <p>You requested to reset your password. Use the OTP below:</p>
//               <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
//                 ${otp}
//               </div>
//               <p>This OTP will expire in 10 minutes.</p>
//               <p>If you didn't request this, please ignore this email.</p>
//             </div>
//           `,
//         };
//       default:
//         return {
//           subject: "Your OTP Code",
//           html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
//         };
//     }
//   }

//   async sendOTP(email: string, otp: string, type: OTPType): Promise<void> {
//     try {
//       const { subject, html } = this.getEmailTemplate(otp, type);

//       await this.transporter.sendMail({
//         from: env.EMAIL_FROM,
//         to: email,
//         subject,
//         html,
//       });

//       logger.info(`OTP email sent to ${email} for type: ${type}`);
//     } catch (error) {
//       logger.error("Failed to send OTP email:", error);
//       return new AppError("Failed to send OTP email");
//     }
//   }
// }

// export default EmailService.getInstance();