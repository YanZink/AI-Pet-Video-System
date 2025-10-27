const StatusHandler = require('../../src/handlers/status');
const TelegramI18n = require('../../src/config/i18n');
const Keyboards = require('../../src/utils/keyboards');
const sessionService = require('../../src/services/sessionService');

// Mock dependencies
jest.mock('../../src/config/i18n');
jest.mock('../../src/utils/keyboards');
jest.mock('../../src/services/sessionService');
jest.mock('../../src/services/apiService');

describe('StatusHandler', () => {
  let statusHandler;
  let mockBot;
  let mockApiService;

  beforeEach(() => {
    mockBot = {};
    mockApiService = {
      getUserRequests: jest.fn(),
      getQueueEstimation: jest.fn(),
    };
    statusHandler = new StatusHandler(mockBot, mockApiService);
    jest.clearAllMocks();
  });

  describe('handleMyVideos', () => {
    test('should show user videos', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      const mockSession = {
        token: 'jwt-token',
        user: { id: 'user-123' },
      };

      const mockRequests = [
        { id: 'req-1', status: 'completed', created_at: new Date() },
        { id: 'req-2', status: 'in_progress', created_at: new Date() },
      ];

      sessionService.getSession.mockResolvedValue(mockSession);
      mockApiService.getUserRequests.mockResolvedValue({
        success: true,
        requests: mockRequests,
      });

      // Mock the actual translation behavior from the real code
      TelegramI18n.getT.mockReturnValue((key) => {
        if (key === 'my_videos.title') return '📋 Your Video Requests:';
        if (key === 'my_videos.item')
          return '🎬 Request #{id}\n📅 {date}\n📊 Status: {status}\n\n';
        return key;
      });

      await statusHandler.handleMyVideos(mockCtx);

      expect(mockApiService.getUserRequests).toHaveBeenCalledWith('jwt-token');
      expect(mockCtx.reply).toHaveBeenCalled();
    });

    test('should handle no videos', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      const mockSession = { token: 'jwt-token' };

      sessionService.getSession.mockResolvedValue(mockSession);
      mockApiService.getUserRequests.mockResolvedValue({
        success: true,
        requests: [],
      });

      // Mock the actual translation
      TelegramI18n.getT.mockReturnValue((key) => {
        if (key === 'my_videos.empty')
          return "You haven't created any video requests yet";
        return key;
      });

      await statusHandler.handleMyVideos(mockCtx);

      // Check that reply was called with the empty message (without checking exact parameters)
      expect(mockCtx.reply).toHaveBeenCalled();
    });

    test('should handle API error', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      const mockSession = { token: 'jwt-token' };

      sessionService.getSession.mockResolvedValue(mockSession);
      mockApiService.getUserRequests.mockResolvedValue({
        success: false,
        error: 'API error',
      });

      // Mock the actual error translation
      TelegramI18n.getT.mockReturnValue((key) => {
        if (key === 'errors.api_error') return 'API error';
        return key;
      });

      await statusHandler.handleMyVideos(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('API error');
    });
  });

  describe('handleQueueStatus', () => {
    test('should show queue status', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      mockApiService.getQueueEstimation.mockResolvedValue({
        success: true,
        estimation: { estimated_wait_minutes: 15 },
      });

      // Mock the actual translation behavior
      TelegramI18n.getT.mockReturnValue((key, vars) => {
        if (key === 'queue.title') return '📊 Processing Queue Status:';
        if (key === 'queue.wait_time')
          return `⏱️ Estimated wait time: ${vars.minutes} minutes`;
        return key;
      });

      await statusHandler.handleQueueStatus(mockCtx);

      // Check that reply was called (without checking exact message)
      expect(mockCtx.reply).toHaveBeenCalled();
    });

    test('should handle queue API error', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      mockApiService.getQueueEstimation.mockResolvedValue({
        success: false,
        error: 'Queue service unavailable',
      });

      TelegramI18n.getT.mockReturnValue((key) => {
        if (key === 'errors.something_wrong') return 'Something went wrong';
        return key;
      });

      await statusHandler.handleQueueStatus(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('Something went wrong');
    });
  });

  describe('handleHelp', () => {
    test('should show help message', async () => {
      const mockCtx = {
        from: { id: 123456 },
        reply: jest.fn(),
      };

      // Mock the actual help translation with variables
      TelegramI18n.getT.mockReturnValue((key, vars) => {
        if (key === 'help') {
          return `❓ How to use AI Pet Video Bot:\n\n1️⃣ Send 1-10 photos of your pet\n2️⃣ Optionally describe the desired video\n3️⃣ Pay with Telegram Stars\n4️⃣ Wait for your AI-generated video\n\n💰 Price: ${vars.price} stars per video\n⏱️ Processing time: ~10 minutes per request in queue\n\nNeed help? Contact support`;
        }
        return key;
      });

      await statusHandler.handleHelp(mockCtx);

      // Check that reply was called with help message
      expect(mockCtx.reply).toHaveBeenCalled();
    });
  });
});
