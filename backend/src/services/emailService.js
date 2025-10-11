const { ses, awsConfig } = require('../config/aws');
const logger = require('../utils/logger');
const localeManager = require('../../../shared-locales');

/**
 * Email Service with real i18n support
 */
class EmailService {
  constructor() {
    this.fromEmail = awsConfig.ses.fromEmail;
    this.localeManager = localeManager;
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
   * Send request status update email with real i18n support
   */
  async sendRequestStatusUpdate(user, request, newStatus) {
    if (!user.email) {
      return { success: false, reason: 'No email address' };
    }

    const language = user.language || 'en';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    const statusText = this.localeManager.translate(
      `videos.status_${newStatus}`,
      language,
      { defaultValue: newStatus }
    );

    const subject = this.localeManager.translate(
      'emails.status_update_subject',
      language,
      { status: statusText }
    );

    const htmlBody = this.generateStatusUpdateEmail({
      user,
      request,
      statusMessage: statusText,
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
   * Generate HTML email with localized content
   */
  generateStatusUpdateEmail(params) {
    const { user, request, statusMessage, frontendUrl, language } = params;
    const helloText = this.localeManager.translate(
      'emails.hello_user',
      language,
      { name: user.first_name || user.username || 'there' }
    );

    const statusTitle = this.localeManager.translate(
      'emails.status_update_title',
      language
    );
    const statusUpdatedText = this.localeManager.translate(
      'emails.status_updated_to',
      language,
      { status: statusMessage }
    );

    const requestDetailsText = this.localeManager.translate(
      'emails.request_details',
      language
    );
    const requestIdText = this.localeManager.translate(
      'emails.request_id',
      language
    );
    const statusLabelText = this.localeManager.translate(
      'emails.status_label',
      language
    );
    const dateLabelText = this.localeManager.translate(
      'emails.date_label',
      language
    );
    const viewRequestText = this.localeManager.translate(
      'emails.view_request_button',
      language
    );
    const bestRegardsText = this.localeManager.translate(
      'emails.best_regards',
      language
    );
    const teamSignatureText = this.localeManager.translate(
      'emails.team_signature',
      language
    );

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
          
          <p>${helloText}</p>
          
          <p>${statusUpdatedText}</p>
          
          <div class="details">
            <h3>${requestDetailsText}</h3>
            <p><strong>${requestIdText}</strong> ${request.id}</p>
            <p><strong>${statusLabelText}</strong> ${statusMessage}</p>
            <p><strong>${dateLabelText}</strong> ${new Date(
      request.created_at
    ).toLocaleDateString()}</p>
          </div>
          
          <a href="${frontendUrl}" class="button">
            ${viewRequestText}
          </a>
          
          <div class="footer">
            <p>${bestRegardsText}<br>${teamSignatureText}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send welcome email to new users with i18n
   */
  async sendWelcomeEmail(user) {
    if (!user.email) {
      return { success: false, reason: 'No email address' };
    }

    const language = user.language || 'en';

    const subject = this.localeManager.translate(
      'emails.welcome_subject',
      language
    );
    const htmlBody = this.generateWelcomeEmail(user, language);

    return await this.sendEmail({
      to: user.email,
      subject,
      htmlBody,
    });
  }

  /**
   * Generate welcome email HTML with localized content
   */
  generateWelcomeEmail(user, language) {
    const helloText = this.localeManager.translate(
      'emails.hello_user',
      language,
      { name: user.first_name || user.username || 'there' }
    );

    const welcomeTitle = this.localeManager.translate(
      'emails.welcome_title',
      language
    );
    const welcomeMessage = this.localeManager.translate(
      'emails.welcome_message',
      language
    );
    const bestRegardsText = this.localeManager.translate(
      'emails.best_regards',
      language
    );
    const teamSignatureText = this.localeManager.translate(
      'emails.team_signature',
      language
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${welcomeTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
          .header { color: #4A90E2; border-bottom: 2px solid #4A90E2; padding-bottom: 10px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${welcomeTitle}</h1>
          </div>
          
          <p>${helloText}</p>
          
          <p>${welcomeMessage}</p>
          
          <p>${bestRegardsText}<br>${teamSignatureText}</p>
        </div>
      </body>
      </html>
    `;
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
