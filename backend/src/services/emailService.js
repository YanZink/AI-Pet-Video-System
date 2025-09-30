const { ses, awsConfig } = require('../config/aws');
const localeManager = require('../locales');
const logger = require('../utils/logger');

/**
 * Updated Email Service with i18n support
 * Uses localeManager for translations instead of hardcoded texts
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

    // Get translations using localeManager
    const subject = localeManager.translate('email.status_updated', language);
    const hello = localeManager.translate('email.hello', language, {
      name: user.first_name || user.username || 'there',
    });
    const requestDetails = localeManager.translate(
      'email.request_details',
      language
    );
    const requestId = localeManager.translate('email.request_id', language);
    const newStatusText = localeManager.translate('email.new_status', language);
    const viewRequest = localeManager.translate('email.view_request', language);
    const regards = localeManager.translate('email.regards', language);

    // Get status message based on new status
    const statusKey = `status.${newStatus}`;
    const statusMessage =
      localeManager.translate(statusKey, language) || newStatus;

    const htmlBody = this.generateStatusUpdateEmail({
      hello,
      requestDetails,
      requestId: request.id,
      newStatus: statusMessage,
      viewRequest,
      regards,
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
   * Generate HTML email with i18n support
   * @param {object} params - Email parameters with translations
   * @returns {string} HTML email content
   */
  generateStatusUpdateEmail(params) {
    const {
      hello,
      requestDetails,
      requestId,
      newStatus,
      viewRequest,
      regards,
      frontendUrl,
      language,
    } = params;

    const isRTL = language === 'ar' || language === 'he'; // Support for RTL languages in future

    return `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8">
        <title>AI Pet Video</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 20px;
            ${isRTL ? 'text-align: right;' : ''}
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            border: 1px solid #e0e0e0; 
            border-radius: 8px; 
          }
          .header { 
            color: #4A90E2; 
            border-bottom: 2px solid #4A90E2; 
            padding-bottom: 10px; 
            margin-bottom: 20px;
          }
          .details { 
            background: #f9f9f9; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .button { 
            background: #4A90E2; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            display: inline-block; 
            margin: 10px 0; 
          }
          .footer { 
            margin-top: 20px; 
            padding-top: 20px; 
            border-top: 1px solid #e0e0e0; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AI Pet Video</h1>
          </div>
          
          <p>${hello}</p>
          
          <p>${
            localeManager.translate(
              `notification.status_${params.newStatus
                .toLowerCase()
                .replace(' ', '_')}`,
              params.language
            ) || params.newStatus
          }</p>
          
          <div class="details">
            <h3>${requestDetails}</h3>
            <p><strong>${requestId}</strong> ${params.requestId}</p>
            <p><strong>${newStatus}</strong> ${params.newStatus}</p>
          </div>
          
          <a href="${frontendUrl}" class="button">
            ${viewRequest}
          </a>
          
          <div class="footer">
            <p>${regards}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send welcome email to new users
   * @param {object} user - User object
   * @returns {Promise<object>} Send result
   */
  async sendWelcomeEmail(user) {
    if (!user.email) {
      return { success: false, reason: 'No email address' };
    }

    const language = user.language || 'en';
    const subject = localeManager.translate('email.welcome_subject', language, {
      defaultValue: 'Welcome to AI Pet Video!',
    });

    const htmlBody = this.generateWelcomeEmail(user, language);

    return await this.sendEmail({
      to: user.email,
      subject,
      htmlBody,
    });
  }

  /**
   * Generate welcome email HTML
   * @param {object} user - User object
   * @param {string} language - Language code
   * @returns {string} HTML email content
   */
  generateWelcomeEmail(user, language) {
    const welcomeMessage = localeManager.translate('system.welcome', language);
    const hello = localeManager.translate('email.hello', language, {
      name: user.first_name || user.username || 'there',
    });
    const regards = localeManager.translate('email.regards', language);

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
          
          <p>${hello}</p>
          
          <p>${welcomeMessage}</p>
          
          <p>${regards}</p>
        </div>
      </body>
      </html>
    `;
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
