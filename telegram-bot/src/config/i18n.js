const axios = require('axios');

class I18nService {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
    this.cache = new Map();
    this.cacheTtl = 2 * 60 * 1000; // 2 minutes cache
  }

  /**
   * Get translation from backend API
   * @param {string} key - Translation key (e.g., 'menu.create_video')
   * @param {string} language - Language code
   * @param {object} variables - Variables to replace
   * @returns {Promise<string>} Translated text
   */
  async translate(key, language = 'en', variables = {}) {
    const cacheKey = `${key}:${language}:${JSON.stringify(variables)}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // In a real implementation, we would call backend API
      // For now, we'll use mock translations that match backend structure
      const translation = this.getMockTranslation(key, language, variables);

      // Cache the result
      this.setToCache(cacheKey, translation);

      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback: return key with variables replaced
      return this.fallbackTranslation(key, variables);
    }
  }

  // Mock translations
  getMockTranslation(key, language, variables) {
    const translations = {
      en: {
        // System texts
        'system.welcome':
          "🐾 Welcome to AI Pet Video!\n\nI'll help you create amazing AI-generated videos with your pet photos.\n\nChoose your language:",
        'system.welcome_back':
          '🐾 Welcome back, {name}!\n\nWhat would you like to do?',
        'system.choose_option': 'Choose an option:',
        'system.main_menu': '🏠 Main Menu',
        'system.something_wrong': '❌ Something went wrong. Please try again.',

        // Menu options
        'menu.create_video': '🎬 Create New Video',
        'menu.my_videos': '📋 My Videos',
        'menu.language': '🌍 Change Language',
        'menu.help': '❓ Help',
        'menu.status': '📊 Queue Status',

        // Language selection
        'language.selected': '✅ Language changed to English',
        'language.choose': '🌍 Choose your language:',

        // Photo upload
        'photos.request':
          "📸 Please send me 1-10 photos of your pet.\n\nYou can send them one by one or as an album.\n\nWhen finished, click 'Continue' button.",
        'photos.received': '📸 Photo {current}/{max} received',
        'photos.max_reached': '❌ Maximum 10 photos allowed',
        'photos.continue': 'Continue with {count} photos',
        'photos.need_photos': 'Please send at least 1 photo first',
        'photos.upload_complete': '✅ {count} photos uploaded successfully!',

        // Script input
        'script.request':
          "✍️ Describe what kind of video you want (optional).\n\nFor example:\n• My dog playing in the park\n• Cat sleeping peacefully\n• Pet birthday party\n\nOr click 'Skip' for a surprise video:",
        'script.received': '✅ Script saved: {script}',
        'script.skip': 'Skip script',
        'script.continue': 'Continue',
        'script.skipped': '✅ Script skipped',

        // Payment
        'payment.summary':
          '📋 Order Summary:\n\n📸 Photos: {photoCount}\n✍️ Script: {script}\n💰 Price: {price} stars\n\nProceed with payment?',
        'payment.no_script': 'No script (surprise video)',
        'payment.confirm': '💳 Pay {price} stars',
        'payment.cancel': '❌ Cancel',
        'payment.processing': '⏳ Processing payment...',
        'payment.success':
          "✅ Payment successful! Your video request has been submitted.\n\nRequest ID: {requestId}\n\nYou'll receive notifications about status updates.",
        'payment.failed': '❌ Payment failed. Please try again.',
        'payment.cancelled': '❌ Payment cancelled',

        // Status messages
        'status.created': '📝 Created - waiting for payment',
        'status.paid': '💳 Paid - added to processing queue',
        'status.in_progress': '⚙️ In Progress - your video is being created',
        'status.completed': '✅ Completed - your video is ready!',
        'status.cancelled': '❌ Cancelled',

        // My videos
        'my_videos.title': '📋 Your Video Requests:',
        'my_videos.empty':
          "You haven't created any video requests yet.\n\nClick 'Create New Video' to get started!",
        'my_videos.item':
          '🎬 Request #{id}\n📅 {date}\n📊 Status: {status}\n\n',
        'my_videos.download': '⬇️ Download Video',
        'my_videos.details': '📋 Details',

        // Queue status
        'queue.title': '📊 Processing Queue Status:',
        'queue.wait_time': '⏱️ Estimated wait time: {minutes} minutes',
        'queue.position': '📍 Your position in queue: #{position}',

        // Error messages
        'errors.network': '❌ Connection error. Please try again.',
        'errors.file_too_large': '❌ File too large. Maximum size: 10MB',
        'errors.invalid_file': '❌ Please send only photos',
        'errors.api_error': '❌ Server error. Please try again later.',
        'errors.no_photos': '❌ Please send at least 1 photo',
        'errors.payment_error': '❌ Payment error. Please contact support.',
        'errors.script_too_long':
          '❌ Script too long. Maximum 1000 characters.',
        'errors.upload_failed': '❌ Photo upload failed. Please try again.',
        'errors.invalid_payment': '❌ Invalid payment data',
        'errors.request_failed': '❌ Request creation failed',

        // Buttons
        'buttons.back': '⬅️ Back',
        'buttons.menu': '🏠 Main Menu',
        'buttons.continue': 'Continue',
        'buttons.cancel': 'Cancel',
        'buttons.retry': '🔄 Retry',

        // Help
        help: '❓ How to use AI Pet Video Bot:\n\n1️⃣ Send 1-10 photos of your pet\n2️⃣ Optionally describe the desired video\n3️⃣ Pay with Telegram Stars\n4️⃣ Wait for your AI-generated video\n\n💰 Price: {price} stars per video\n⏱️ Processing time: ~10 minutes per request in queue\n\nNeed help? Contact @support',

        // Notifications
        'notifications.choose_option': 'Choose an option:',
        'notifications.update_title': '🔔 Video Request Update',
        'notifications.request_id': '📋 Request:',
        'notifications.status': '📊 Status:',
        'notifications.completed_message':
          '🎉 Your video is ready for download!',
        'notifications.in_progress_message':
          '⚙️ Your video is being created...',
      },
      ru: {
        // System texts
        'system.welcome':
          '🐾 Добро пожаловать в AI Pet Video!\n\nЯ помогу вам создать удивительные AI-видео с фотографиями ваших питомцев.\n\nВыберите язык:',
        'system.welcome_back':
          '🐾 С возвращением, {name}!\n\nЧто хотите сделать?',
        'system.choose_option': 'Выберите опцию:',
        'system.main_menu': '🏠 Главное меню',
        'system.something_wrong': '❌ Что-то пошло не так. Попробуйте еще раз.',

        // Menu options
        'menu.create_video': '🎬 Создать видео',
        'menu.my_videos': '📋 Мои видео',
        'menu.language': '🌍 Сменить язык',
        'menu.help': '❓ Помощь',
        'menu.status': '📊 Статус очереди',

        // Language selection
        'language.selected': '✅ Язык изменен на русский',
        'language.choose': '🌍 Выберите язык:',

        // Photo upload
        'photos.request':
          "📸 Отправьте мне 1-10 фотографий вашего питомца.\n\nМожете отправлять по одной или альбомом.\n\nКогда закончите, нажмите 'Продолжить'.",
        'photos.received': '📸 Получена фотография {current}/{max}',
        'photos.max_reached': '❌ Максимум 10 фотографий',
        'photos.continue': 'Продолжить с {count} фото',
        'photos.need_photos': 'Сначала отправьте хотя бы 1 фотографию',
        'photos.upload_complete': '✅ {count} фотографий загружено успешно!',

        // Script input
        'script.request':
          "✍️ Опишите, какое видео хотите получить (необязательно).\n\nНапример:\n• Моя собака играет в парке\n• Кот мирно спит\n• День рождения питомца\n\nИли нажмите 'Пропустить' для видео-сюрприза:",
        'script.received': '✅ Сценарий сохранен: {script}',
        'script.skip': 'Пропустить сценарий',
        'script.continue': 'Продолжить',
        'script.skipped': '✅ Сценарий пропущен',

        // Payment
        'payment.summary':
          '📋 Сводка заказа:\n\n📸 Фотографий: {photoCount}\n✍️ Сценарий: {script}\n💰 Цена: {price} звезд\n\nОплатить?',
        'payment.no_script': 'Без сценария (видео-сюрприз)',
        'payment.confirm': '💳 Оплатить {price} звезд',
        'payment.cancel': '❌ Отмена',
        'payment.processing': '⏳ Обрабатываем платеж...',
        'payment.success':
          '✅ Оплата прошла успешно! Ваша заявка на видео отправлена.\n\nID заявки: {requestId}\n\nВы будете получать уведомления о статусе.',
        'payment.failed': '❌ Ошибка оплаты. Попробуйте еще раз.',
        'payment.cancelled': '❌ Оплата отменена',

        // Status messages
        'status.created': '📝 Создана - ожидает оплаты',
        'status.paid': '💳 Оплачена - добавлена в очередь',
        'status.in_progress': '⚙️ В работе - создается ваше видео',
        'status.completed': '✅ Готово - ваше видео готово!',
        'status.cancelled': '❌ Отменена',

        // My videos
        'my_videos.title': '📋 Ваши заявки на видео:',
        'my_videos.empty':
          "У вас пока нет заявок на видео.\n\nНажмите 'Создать видео' чтобы начать!",
        'my_videos.item': '🎬 Заявка #{id}\n📅 {date}\n📊 Статус: {status}\n\n',
        'my_videos.download': '⬇️ Скачать видео',
        'my_videos.details': '📋 Подробности',

        // Queue status
        'queue.title': '📊 Статус очереди обработки:',
        'queue.wait_time': '⏱️ Примерное время ожидания: {minutes} минут',
        'queue.position': '📍 Ваша позиция в очереди: #{position}',

        // Error messages
        'errors.network': '❌ Ошибка соединения. Попробуйте еще раз.',
        'errors.file_too_large': '❌ Файл слишком большой. Максимум: 10МБ',
        'errors.invalid_file': '❌ Отправляйте только фотографии',
        'errors.api_error': '❌ Ошибка сервера. Попробуйте позже.',
        'errors.no_photos': '❌ Отправьте хотя бы 1 фотографию',
        'errors.payment_error': '❌ Ошибка оплаты. Обратитесь в поддержку.',
        'errors.script_too_long':
          '❌ Сценарий слишком длинный. Максимум 1000 символов.',
        'errors.upload_failed': '❌ Ошибка загрузки фото. Попробуйте еще раз.',
        'errors.invalid_payment': '❌ Неверные данные платежа',
        'errors.request_failed': '❌ Ошибка создания заявки',

        // Buttons
        'buttons.back': '⬅️ Назад',
        'buttons.menu': '🏠 Главное меню',
        'buttons.continue': 'Продолжить',
        'buttons.cancel': 'Отмена',
        'buttons.retry': '🔄 Повторить',

        // Help
        help: '❓ Как использовать AI Pet Video Bot:\n\n1️⃣ Отправьте 1-10 фото питомца\n2️⃣ Опционально опишите желаемое видео\n3️⃣ Оплатите звездами Telegram\n4️⃣ Ждите свое AI-видео\n\n💰 Цена: {price} звезд за видео\n⏱️ Время обработки: ~10 минут на заявку в очереди\n\nНужна помощь? Обратитесь к @Yan_Zink',

        // Notifications
        'notifications.choose_option': 'Выберите опцию:',
        'notifications.update_title': '🔔 Обновление заявки на видео',
        'notifications.request_id': '📋 Заявка:',
        'notifications.status': '📊 Статус:',
        'notifications.completed_message':
          '🎉 Ваше видео готово для скачивания!',
        'notifications.in_progress_message': '⚙️ Ваше видео создается...',
      },
    };

    let translation =
      translations[language]?.[key] || translations['en'][key] || key;

    // Replace variables
    Object.keys(variables).forEach((variable) => {
      translation = translation.replace(
        new RegExp(`{${variable}}`, 'g'),
        variables[variable]
      );
    });

    return translation;
  }

  // Fallback translation when API is unavailable
  fallbackTranslation(key, variables) {
    let result = key;
    Object.keys(variables).forEach((variable) => {
      result = result.replace(
        new RegExp(`{${variable}}`, 'g'),
        variables[variable]
      );
    });
    return result;
  }

  // Get all translations for a language
  async getLocale(language = 'en') {
    try {
      // In production, this would fetch from backend
      // For now, return mock locale matching the structure
      return this.getMockTranslation.bind(this, '', language, {});
    } catch (error) {
      console.error('Failed to get locale:', error);
      return this.getMockTranslation.bind(this, '', 'en', {});
    }
  }

  //Cache management
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.value;
    }

    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  setToCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  //Clear cache (useful for testing)
  clearCache() {
    this.cache.clear();
  }

  //Check if language is supported
  isLanguageSupported(language) {
    return ['en', 'ru'].includes(language);
  }
}

// Create singleton instance
const i18nService = new I18nService();

module.exports = i18nService;
