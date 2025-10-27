// Define mockSES first
const mockSES = {
  sendEmail: jest.fn().mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue({
      MessageId: 'mock-message-id',
    }),
  })),
};

// Mock AWS SES
jest.mock('../../../src/config/aws', () => ({
  ses: mockSES,
  awsConfig: {
    ses: {
      fromEmail: 'test@example.com',
    },
  },
}));

// Mock fs for email templates
jest.mock('fs', () => ({
  promises: {
    readFile: jest
      .fn()
      .mockResolvedValue(
        '<!DOCTYPE html><html><body>{{helloText}} {{verifyMessage}}</body></html>'
      ),
  },
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mock/template/path'),
}));

// Mock shared-locales
jest.mock('../../../../shared-locales', () => ({
  translate: jest.fn((key, language, variables = {}) => {
    const translations = {
      en: {
        'emails.verify_email_subject': 'Verify Your Email',
        'emails.hello_user': 'Hello {name}',
        'emails.verify_email_message': 'Please verify your email',
        'emails.verify_email_button': 'Verify Email',
        'emails.best_regards': 'Best regards',
        'emails.team_signature': 'AI Pet Video Team',
        'emails.payment_confirmation_subject': 'Payment Confirmed',
        'emails.payment_confirmed': 'Your payment was confirmed',
        'emails.payment_amount': 'Amount: ${amount}',
        'emails.view_request_button': 'View Request',
        'emails.request_created_subject': 'Request Created',
        'emails.request_created': 'Your request was created',
        'emails.welcome_subject': 'Welcome to AI Pet Video',
        'emails.welcome_title': 'Welcome!',
        'emails.welcome_message': 'Thank you for joining us',
      },
    };
    let translation = translations[language]?.[key] || key;
    Object.keys(variables).forEach((variable) => {
      translation = translation.replace(
        new RegExp(`{${variable}}`, 'g'),
        variables[variable]
      );
    });
    return translation;
  }),
}));

const emailService = require('../../../src/services/emailService');

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test email</p>',
      };

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id');
      expect(mockSES.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          Destination: {
            ToAddresses: [emailData.to],
          },
          Message: {
            Body: {
              Html: {
                Charset: 'UTF-8',
                Data: emailData.htmlBody,
              },
            },
            Subject: {
              Charset: 'UTF-8',
              Data: emailData.subject,
            },
          },
        })
      );
    });

    it('should include text body when provided', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test email</p>',
        textBody: 'Test email text',
      };

      await emailService.sendEmail(emailData);

      expect(mockSES.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Text: {
                Charset: 'UTF-8',
                Data: emailData.textBody,
              },
            }),
          }),
        })
      );
    });

    it('should handle email sending error', async () => {
      mockSES.sendEmail.mockImplementationOnce(() => ({
        promise: jest.fn().mockRejectedValue(new Error('SES error')),
      }));

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test email</p>',
      };

      await expect(emailService.sendEmail(emailData)).rejects.toThrow(
        'Failed to send email'
      );
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      const user = {
        email: 'user@example.com',
        first_name: 'John',
        language: 'en',
      };
      const verificationToken = 'test-token-123';

      const result = await emailService.sendVerificationEmail(
        user,
        verificationToken
      );

      expect(result.success).toBe(true);
    });

    it('should return failure for user without email', async () => {
      const user = {
        first_name: 'John',
        language: 'en',
      };
      const verificationToken = 'test-token-123';

      const result = await emailService.sendVerificationEmail(
        user,
        verificationToken
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('No email address');
    });
  });

  describe('compileTemplate', () => {
    it('should compile template with variables', async () => {
      const templateName = 'test-template';
      const variables = {
        helloText: 'Hello World',
        verifyMessage: 'Test message',
      };

      const result = await emailService.compileTemplate(
        templateName,
        variables
      );

      expect(result).toContain('Hello World');
      expect(result).toContain('Test message');
    });

    it('should handle template file error', async () => {
      const fs = require('fs');
      fs.promises.readFile.mockRejectedValueOnce(new Error('File not found'));

      await expect(
        emailService.compileTemplate('nonexistent', {})
      ).rejects.toThrow('Failed to load email template: nonexistent');
    });
  });
});
