// Email settings manager
// This is a simple in-memory storage for email notification settings
// In a production environment, this would be stored in a database

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailSettings {
  notificationEmail: string;
  notifyOnRetailNotes: boolean;
  smtpServer: string;
  smtpPort: number;
  smtpUsername: string; 
  smtpPassword: string;
  smtpFromEmail: string;
  useSmtp: boolean;
}

class EmailSettingsManager {
  private settings: EmailSettings = {
    notificationEmail: '',
    notifyOnRetailNotes: true,
    smtpServer: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpFromEmail: '',
    useSmtp: false
  };
  
  private smtpTransporter: Transporter | null = null;

  getSettings(): EmailSettings {
    return { ...this.settings };
  }

  updateSettings(settings: Partial<EmailSettings>): EmailSettings {
    this.settings = {
      ...this.settings,
      ...settings
    };
    
    // Reset transporter when settings change
    this.smtpTransporter = null;
    
    return { ...this.settings };
  }

  isConfigured(): boolean {
    return Boolean(this.settings.notificationEmail);
  }
  
  isSmtpConfigured(): boolean {
    return this.settings.useSmtp && 
           Boolean(this.settings.smtpServer) && 
           Boolean(this.settings.smtpPort) &&
           Boolean(this.settings.smtpFromEmail);
  }
  
  private getSmtpTransporter(): Transporter {
    if (!this.smtpTransporter && this.isSmtpConfigured()) {
      const transportConfig: any = {
        host: this.settings.smtpServer,
        port: this.settings.smtpPort,
        secure: this.settings.smtpPort === 465, // true for 465, false for other ports
      };
      
      // Add authentication if username/password are provided
      if (this.settings.smtpUsername && this.settings.smtpPassword) {
        transportConfig.auth = {
          user: this.settings.smtpUsername,
          pass: this.settings.smtpPassword,
        };
      }
      
      this.smtpTransporter = nodemailer.createTransport(transportConfig);
    }
    
    return this.smtpTransporter as Transporter;
  }

  // Send email via SMTP or fallback to console log
  async sendEmailNotification(subject: string, message: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log("Email notification not sent: No email configured");
      return false;
    }

    try {
      if (this.isSmtpConfigured()) {
        // Use SMTP to send email
        const transporter = this.getSmtpTransporter();
        
        const info = await transporter.sendMail({
          from: this.settings.smtpFromEmail,
          to: this.settings.notificationEmail,
          subject: subject,
          text: message,
          html: message.replace(/\n/g, '<br>')
        });
        
        console.log(`[EMAIL SENT] Message ID: ${info.messageId}`);
        return true;
      } else {
        // Fallback to console logging
        console.log(`[EMAIL NOTIFICATION - CONSOLE ONLY]
To: ${this.settings.notificationEmail}
Subject: ${subject}

${message}
        `);
        return true;
      }
    } catch (error) {
      console.error("Error sending email notification:", error);
      return false;
    }
  }

  // Send a test email to verify configuration
  async sendTestEmail(): Promise<boolean> {
    return this.sendEmailNotification(
      "Farm Manager Test Email",
      "This is a test email from your Farm Manager application. If you received this, your email notifications are working correctly."
    );
  }
}

// Singleton instance
export const emailSettings = new EmailSettingsManager();