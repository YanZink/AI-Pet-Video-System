const { ses, awsConfig } = require('../config/aws');
const logger = require('../utils/logger');

/**
 * Email Service with i18n support
 */
class EmailService {
  constructor() {
    this.fromEmail = awsConfig.ses.fromEmail;
  }

  async sendEmail({ to, subject, htmlBody, textBody = null }) {
    try {
      const params = {
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to],
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: htmlBody,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject,
          },
        },
        Source: this.fromEmail,
      };

      if (textBody) {
        params.Message.Body.Text = {
          Charset: 'UTF-8',
          Data: textBody,
        };
      }

      const result = await ses.sendEmail(params).promise();

      logger.info('Email sent successfully', {
        messageId: result.MessageId,
        to,
        subject,
      });

      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send request status update email with i18n support
   * @param {object} user - User object with language preference
   * @param {object} request - Request object
   * @param {string} newStatus - New status value
   * @returns {Promise<object>} Send result
   */
  async sendRequestStatusUpdate(user, request, newStatus) {
    if (!user.email) {
      return { success: false, reason: 'No email address' };
    }

    const language = user.language || 'en';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // Get translations using req.t style (will be handled by calling function)
    const subject = `AI Pet Video - ${this.getStatusText(newStatus, language)}`;
    const statusMessage = this.getStatusText(newStatus, language);

    const htmlBody = this.generateStatusUpdateEmail({
      user,
      request,
      statusMessage,
      frontendUrl,
      language,
    });

    return await this.sendEmail({
      to: user.email,
      subject,
      htmlBody,
    });
  }

  /**
   * Get localized status text
   */
  getStatusText(status, language) {
    const statusMap = {
      created: 'Request Created',
      paid: 'Payment Received',
      in_progress: 'Video in Progress',
      completed: 'Video Ready',
      cancelled: 'Request Cancelled',
    };
    return statusMap[status] || status;
  }

  /**
   * Generate HTML email
   */
  generateStatusUpdateEmail(params) {
    const { user, request, statusMessage, frontendUrl, language } = params;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>AI Pet Video</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
          .header { color: #4A90E2; border-bottom: 2px solid #4A90E2; padding-bottom: 10px; margin-bottom: 20px; }
          .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { background: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AI Pet Video</h1>
          </div>
          
          <p>Hello ${user.first_name || user.username || 'there'},</p>
          
          <p>Your video request status has been updated to: <strong>${statusMessage}</strong></p>
          
          <div class="details">
            <h3>Request Details:</h3>
            <p><strong>Request ID:</strong> ${request.id}</p>
            <p><strong>Status:</strong> ${statusMessage}</p>
            <p><strong>Date:</strong> ${new Date(
              request.created_at
            ).toLocaleDateString()}</p>
          </div>
          
          <a href="${frontendUrl}" class="button">
            View Request
          </a>
          
          <div class="footer">
            <p>Best regards,<br>AI Pet Video Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(user) {
    if (!user.email) {
      return { success: false, reason: 'No email address' };
    }

    const subject = 'Welcome to AI Pet Video!';

    const htmlBody = this.generateWelcomeEmail(user);

    return await this.sendEmail({
      to: user.email,
      subject,
      htmlBody,
    });
  }

  /**
   * Generate welcome email HTML
   */
  generateWelcomeEmail(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to AI Pet Video</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
          .header { color: #4A90E2; border-bottom: 2px solid #4A90E2; padding-bottom: 10px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AI Pet Video</h1>
          </div>
          
          <p>Hello ${user.first_name || user.username || 'there'},</p>
          
          <p>Welcome to AI Pet Video! We're excited to help you create amazing videos of your pets.</p>
          
          <p>Best regards,<br>AI Pet Video Team</p>
        </div>
      </body>
      </html>
    `;
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
