// Email settings manager
// This is a simple in-memory storage for email notification settings
// In a production environment, this would be stored in a database

interface EmailSettings {
  notificationEmail: string;
  notifyOnRetailNotes: boolean;
}

class EmailSettingsManager {
  private settings: EmailSettings = {
    notificationEmail: '',
    notifyOnRetailNotes: true
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

  // In a real application, this would send an email via SMTP or an API
  async sendEmailNotification(subject: string, message: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log("Email notification not sent: No email configured");
      return false;
    }

    // Log the email that would be sent in a real implementation
    console.log(`[EMAIL NOTIFICATION]
To: ${this.settings.notificationEmail}
Subject: ${subject}

${message}
    `);

    // In a real implementation, this would use an email service
    // For now, we'll simulate success
    return true;
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