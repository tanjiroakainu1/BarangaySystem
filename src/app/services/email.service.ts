import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG, EMAIL_TEMPLATES, DEVELOPMENT_MODE } from '../config/email.config';

export interface OTPEmailData {
  to: string;
  otp: string;
  userName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private isInitialized = false;

  constructor() {
    if (!DEVELOPMENT_MODE) {
      this.initializeEmailJS();
    }
  }

  private initializeEmailJS() {
    try {
      // Initialize EmailJS with your public key
      emailjs.init(EMAIL_CONFIG.publicKey);
      this.isInitialized = true;
      console.log('EmailJS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
      this.isInitialized = false;
    }
  }

  async sendOTPEmail(emailData: OTPEmailData): Promise<{ success: boolean; message?: string }> {
    // Development mode - just log the OTP
    if (DEVELOPMENT_MODE) {
      console.log(`🔐 OTP for ${emailData.to}: ${emailData.otp}`);
      console.log(`📧 Email would be sent to: ${emailData.to}`);
      console.log(`👤 User: ${emailData.userName || 'User'}`);
      
      // Show OTP in alert for easy testing
      alert(`OTP for ${emailData.to}: ${emailData.otp}\n\nThis is development mode. Check console for details.`);
      
      return { success: true, message: 'OTP generated (check console for development)' };
    }

    if (!this.isInitialized) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const templateParams = {
        to_email: emailData.to,
        to_name: emailData.userName || 'User',
        otp_code: emailData.otp,
        expiry_minutes: EMAIL_TEMPLATES.OTP_EXPIRY_MINUTES,
        // Add additional parameters that might be expected
        from_name: EMAIL_TEMPLATES.FROM_NAME,
        subject: EMAIL_TEMPLATES.OTP_SUBJECT
      };

      console.log('Sending email with params:', templateParams);

      const response = await emailjs.send(
        EMAIL_CONFIG.serviceId,
        EMAIL_CONFIG.templateId,
        templateParams
      );

      console.log('OTP Email sent successfully:', response);
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      console.error('Error details:', error);
      return { success: false, message: 'Failed to send OTP email' };
    }
  }

  // Method to test email configuration
  async testEmailConnection(): Promise<{ success: boolean; message?: string }> {
    if (!this.isInitialized) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      // Send a test email with minimal parameters
              const testParams = {
                to_email: 'user@gmail.com',
                to_name: 'Test User',
                otp_code: '1234',
                expiry_minutes: 10
              };

      console.log('Testing email with params:', testParams);
      console.log('Service ID:', EMAIL_CONFIG.serviceId);
      console.log('Template ID:', EMAIL_CONFIG.templateId);

      const response = await emailjs.send(
        EMAIL_CONFIG.serviceId,
        EMAIL_CONFIG.templateId,
        testParams
      );

      console.log('Test email sent successfully:', response);
      return { success: true, message: 'Email service is working correctly' };
    } catch (error) {
      console.error('Email connection test failed:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      return { success: false, message: 'Email service connection failed' };
    }
  }
}
