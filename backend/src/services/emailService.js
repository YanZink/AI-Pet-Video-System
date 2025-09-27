const { ses, awsConfig } = require('../config/aws');
const logger = require('../utils/logger');

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

  async sendRequestStatusUpdate(user, request, newStatus) {
    if (!user.email) {
      return { success: false, reason: 'No email address' };
    }

    const statusMessages = {
      ru: {
        paid: 'Ваша заявка оплачена и добавлена в очередь обработки',
        in_progress: 'Ваша заявка взята в работу',
        completed: 'Ваше видео готово!',
        cancelled: 'Ваша заявка отменена',
      },
      en: {
        paid: 'Your request has been paid and added to processing queue',
        in_progress: 'Your request is being processed',
        completed: 'Your video is ready!',
        cancelled: 'Your request has been cancelled',
      },
    };

    const lang = user.language || 'en';
    const message = statusMessages[lang][newStatus];

    const subject =
      lang === 'ru'
        ? 'AI Pet Video - Статус заявки изменен'
        : 'AI Pet Video - Request Status Updated';

    const htmlBody = this.generateStatusUpdateEmail(
      user,
      request,
      newStatus,
      message,
      lang
    );

    return await this.sendEmail({
      to: user.email,
      subject,
      htmlBody,
    });
  }

  generateStatusUpdateEmail(user, request, newStatus, message, lang) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>AI Pet Video</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4A90E2;">AI Pet Video</h1>
          
          <p>${lang === 'ru' ? 'Привет' : 'Hello'} ${
      user.first_name || user.username || 'there'
    }!</p>
          
          <p>${message}</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>${lang === 'ru' ? 'Детали заявки:' : 'Request Details:'}</h3>
            <p><strong>${
              lang === 'ru' ? 'ID заявки:' : 'Request ID:'
            }</strong> ${request.id}</p>
            <p><strong>${
              lang === 'ru' ? 'Статус:' : 'Status:'
            }</strong> ${newStatus}</p>
          </div>
          
          <a href="${frontendUrl}" 
             style="background: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            ${lang === 'ru' ? 'Посмотреть заявку' : 'View Request'}
          </a>
        </div>
      </body>
      </html>
    `;
  }
}

const emailService = new EmailService();

module.exports = emailService;
