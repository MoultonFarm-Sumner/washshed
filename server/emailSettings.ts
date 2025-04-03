// Email settings manager
// This is a simple in-memory storage for email notification settings
// In a production environment, this would be stored in a database

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

  getSettings(): EmailSettings {
    return { ...this.settings };
  }

  updateSettings(settings: Partial<EmailSettings>): EmailSettings {
    this.settings = {
      ...this.settings,
      ...settings
    };
    return { ...this.settings };
  }

  isConfigured(): boolean {
    return Boolean(this.settings.notificationEmail);
  }

  // Send email via SMTP or SendGrid API
  async sendEmailNotification(subject: string, message: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log("Email notification not sent: No email configured");
      return false;
    }

    try {
      if (this.settings.useSmtp && this.settings.smtpServer) {
        // SMTP implementation would go here in future
        console.log(`[EMAIL NOTIFICATION - SMTP]
To: ${this.settings.notificationEmail}
From: ${this.settings.smtpFromEmail}
Subject: ${subject}
Server: ${this.settings.smtpServer}:${this.settings.smtpPort}

${message}
        `);
        return true;
      } else {
        // Log email for now, but SendGrid will be used once configured
        console.log(`[EMAIL NOTIFICATION - SendGrid]
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