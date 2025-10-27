const PhotoUploadHandler = require('../../src/handlers/photoUpload');
const TelegramI18n = require('../../src/config/i18n');
const Keyboards = require('../../src/utils/keyboards');
const sessionService = require('../../src/services/sessionService');

// Mock dependencies
jest.mock('../../src/config/i18n');
jest.mock('../../src/utils/keyboards');
jest.mock('../../src/services/sessionService');

describe('PhotoUploadHandler', () => {
  let photoUploadHandler;
  let mockBot;

  beforeEach(() => {
    mockBot = {};
    photoUploadHandler = new PhotoUploadHandler(mockBot);
    jest.clearAllMocks();
  });

  describe('startPhotoUpload', () => {
    test('should initialize photo upload session', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      const mockSession = {
        token: 'jwt-token',
        user: { id: 'user-123', language: 'en' },
      };

      sessionService.getSession.mockResolvedValue(mockSession);
      sessionService.saveSession.mockResolvedValue(true);

      const mockT = jest.fn((key) => {
        if (key === 'photos.request') return '📸 Send me photos of your pet';
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      await photoUploadHandler.startPhotoUpload(mockCtx);

      expect(sessionService.saveSession).toHaveBeenCalledWith(123456, {
        ...mockSession,
        state: 'uploading_photos',
        uploadData: {
          photos: [],
          uploadedPhotos: [],
          script: null,
          currentRequestId: null,
        },
      });
      expect(mockCtx.reply).toHaveBeenCalledWith(
        '📸 Send me photos of your pet',
        {
          reply_markup: { remove_keyboard: true },
        }
      );
    });

    test('should handle missing session', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      sessionService.getSession.mockResolvedValue(null);

      const mockT = jest.fn((key) => {
        if (key === 'errors.something_wrong') return 'Something went wrong';
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      await photoUploadHandler.startPhotoUpload(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('Something went wrong');
    });
  });

  describe('handlePhotoContinue', () => {
    test('should transition to script input', async () => {
      const mockCtx = {
        from: { id: 123456 },
        editMessageText: jest.fn(),
        reply: jest.fn(),
      };

      const mockSession = {
        token: 'jwt-token',
        user: { id: 'user-123', language: 'en' },
        uploadData: {
          photos: [{ telegramFileId: 'photo1' }],
        },
      };

      sessionService.getSession.mockResolvedValue(mockSession);
      sessionService.saveSession.mockResolvedValue(true);

      const mockT = jest.fn((key, vars = {}) => {
        if (key === 'photos.upload_complete')
          return `Uploaded ${vars.count} photos`;
        if (key === 'script.request')
          return '✍️ Describe your video (optional)';
        return key;
      });
      TelegramI18n.getT.mockReturnValue(mockT);

      Keyboards.scriptOptions.mockReturnValue({ inline_keyboard: [] });

      await photoUploadHandler.handlePhotoContinue(mockCtx);

      expect(sessionService.saveSession).toHaveBeenCalledWith(123456, {
        ...mockSession,
        state: 'entering_script',
      });
      expect(mockCtx.editMessageText).toHaveBeenCalledWith('Uploaded 1 photos');
    });
  });
});
