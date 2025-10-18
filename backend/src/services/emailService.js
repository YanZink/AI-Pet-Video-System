const { ses, awsConfig } = require('../config/aws');
const logger = require('../utils/logger');
const localeManager = require('../../../shared-locales');
const fs = require('fs').promises;
const path = require('path');

/**
 * Email Service with real i18n support
 */
class EmailService {
  constructor() {
    this.fromEmail = awsConfig.ses.fromEmail;
    this.localeManager = localeManager;
    this.templatesDir = path.join(__dirname, '../email-templates');
  }

  /**
   * Read and compile email template
   */
  async compileTemplate(templateName, variables) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf8');

      // Replace variables in template
      Object.keys(variables).forEach((key) => {
        const placeholder = `{{${key}}}`;
        template = template.replace(
          new RegExp(placeholder, 'g'),
          variables[key]
        );
      });

      return template;
    } catch (error) {
      logger.error('Failed to compile email template:', {
        templateName,
        error: error.message,
      });
      throw new Error(`Failed to load email template: ${templateName}`);
    }
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
   * Send email verification link
   */
  async sendVerificationEmail(user, verificationToken) {
    if (!user.email) {
      return { success: false, reason: 'No email address' };
    }

    const language = user.language || 'en';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const subject = this.localeManager.translate(
      'emails.verify_email_subject',
      language
    );

    const templateVariables = {
      helloText: this.localeManager.translate('emails.hello_user', language, {
        name: user.first_name || user.username || 'there',
      }),
      verifyMessage: this.localeManager.translate(
        'emails.verify_email_message',
        language
      ),
      verifyButton: this.localeManager.translate(
        'emails.verify_email_button',
        language
      ),
      verificationUrl: verificationUrl,
      bestRegardsText: this.localeManager.translate(
        'emails.best_regards',
        language
      ),
      teamSignatureText: this.localeManager.translate(
        'emails.team_signature',
        language
      ),
    };

    const htmlBody = await this.compileTemplate(
      'verification-email',
      templateVariables
    );

    return await this.sendEmail({
      to: user.email,
      subject,
      htmlBody,
    });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(user, request, paymentAmount) {
    if (!user.email) {
      return { success: false, reason: 'No email address' };
    }

    const language = user.language || 'en';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    const subject = this.localeManager.translate(
      'emails.payment_confirmation_subject',
      language
    );

    const templateVariables = {
      helloText: this.localeManager.translate('emails.hello_user', language, {
        name: user.first_name || user.username || 'there',
      }),
      paymentConfirmed: this.localeManager.translate(
        'emails.payment_confirmed',
        language
      ),
      amountText: this.localeManager.translate(
        'emails.payment_amount',
        language,
        { amount: paymentAmount }
      ),
      requestId: request.id,
      viewRequestUrl: `${frontendUrl}/dashboard/requests/${request.id}`,
      viewRequestText: this.localeManager.translate(
        'emails.view_request_button',
        language
      ),
      bestRegardsText: this.localeManager.translate(
        'emails.best_regards',
        language
      ),
      teamSignatureText: this.localeManager.translate(
        'emails.team_signature',
        language
      ),
    };

    const htmlBody = await this.compileTemplate(
      'payment-confirmation',
      templateVariables
    );

    return await this.sendEmail({
      to: user.email,
      subject,
      htmlBody,
    });
  }

  /**
   * Send request creation confirmation
   */
  async sendRequestCreationConfirmation(user, request) {
    if (!user.email) {
      return { success: false, reason: 'No email address' };
    }

    const language = user.language || 'en';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    const subject = this.localeManager.translate(
      'emails.request_created_subject',
      language
    );

    const templateVariables = {
      helloText: this.localeManager.translate('emails.hello_user', language, {
        name: user.first_name || user.username || 'there',
      }),
      requestCreated: this.localeManager.translate(
        'emails.request_created',
        language
      ),
      viewRequestUrl: `${frontendUrl}/dashboard/requests/${request.id}`,
      viewRequestText: this.localeManager.translate(
        'emails.view_request_button',
        language
      ),
      bestRegardsText: this.localeManager.translate(
        'emails.best_regards',
        language
      ),
      teamSignatureText: this.localeManager.translate(
        'emails.team_signature',
        language
      ),
    };

    const htmlBody = await this.compileTemplate(
      'request-created',
      templateVariables
    );

    return await this.sendEmail({
      to: user.email,
      subject,
      htmlBody,
    });
  }

  /**
   * Send request status update email
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

    const templateVariables = {
      helloText: this.localeManager.translate('emails.hello_user', language, {
        name: user.first_name || user.username || 'there',
      }),
      statusUpdatedText: this.localeManager.translate(
        'emails.status_updated_to',
        language,
        { status: statusText }
      ),
      requestDetailsText: this.localeManager.translate(
        'emails.request_details',
        language
      ),
      requestIdText: this.localeManager.translate(
        'emails.request_id',
        language
      ),
      statusLabelText: this.localeManager.translate(
        'emails.status_label',
        language
      ),
      dateLabelText: this.localeManager.translate(
        'emails.date_label',
        language
      ),
      requestId: request.id,
      statusMessage: statusText,
      requestDate: new Date(request.created_at).toLocaleDateString(),
      frontendUrl: frontendUrl,
      viewRequestText: this.localeManager.translate(
        'emails.view_request_button',
        language
      ),
      bestRegardsText: this.localeManager.translate(
        'emails.best_regards',
        language
      ),
      teamSignatureText: this.localeManager.translate(
        'emails.team_signature',
        language
      ),
    };

    const htmlBody = await this.compileTemplate(
      'status-update',
      templateVariables
    );

    return await this.sendEmail({
      to: user.email,
      subject,
      htmlBody,
    });
  }

  /**
   * Send welcome email to new users
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

    const templateVariables = {
      helloText: this.localeManager.translate('emails.hello_user', language, {
        name: user.first_name || user.username || 'there',
      }),
      welcomeTitle: this.localeManager.translate(
        'emails.welcome_title',
        language
      ),
      welcomeMessage: this.localeManager.translate(
        'emails.welcome_message',
        language
      ),
      bestRegardsText: this.localeManager.translate(
        'emails.best_regards',
        language
      ),
      teamSignatureText: this.localeManager.translate(
        'emails.team_signature',
        language
      ),
    };

    const htmlBody = await this.compileTemplate(
      'welcome-email',
      templateVariables
    );

    return await this.sendEmail({
      to: user.email,
      subject,
      htmlBody,
    });
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
