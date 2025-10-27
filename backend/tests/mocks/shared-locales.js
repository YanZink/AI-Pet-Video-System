const localeManager = {
  isLanguageSupported: jest.fn((lang) => ['en', 'ru'].includes(lang)),
  getSupportedLanguages: jest.fn(() => ['en', 'ru']),
  getTranslations: jest.fn((lang) => ({})),

  translate: jest.fn((key, language = 'en', variables = {}) => {
    const translations = {
      en: {
        'auth.user_exists': 'User already exists',
        'auth.invalid_credentials': 'Invalid credentials',
        'auth.login_success': 'Login successful',
        'auth.created_success': 'User created successfully.',
        'auth.telegram_created': 'User created from Telegram',
        'auth.unsupported_language': 'Unsupported language',
        'errors.validation_error': 'Validation error',
        'errors.request_not_found': 'Request not found',
        'errors.already_paid': 'Already paid',
        'errors.invalid_payment': 'Invalid payment',
        'errors.template_not_found': 'Template not found',
        'errors.max_photos_reached': 'Maximum photos reached',
        'errors.invalid_file': 'Invalid file',
        'errors.upload_failed': 'Upload failed',
        'common.continue': 'Continue',
        'common.upload_urls_generated': 'Upload URLs generated',
        'common.wait_time': 'Estimated wait time: {minutes} minutes',
        'common.language_selected': 'Language updated successfully',
        'payments.success': 'Payment successful',
        'payments.price_stars': '{stars} stars (${usd})',
        'payments.checkout_created': 'Checkout session created',
        'emails.verify_email_subject': 'Verify Your Email',
        'emails.hello_user': 'Hello {name}',
      },
      ru: {
        'auth.user_exists': 'Пользователь уже существует',
        'auth.invalid_credentials': 'Неверные учетные данные',
        'auth.login_success': 'Вход выполнен успешно',
        'auth.created_success': 'Пользователь создан успешно',
        'auth.telegram_created': 'Пользователь создан из Telegram',
        'auth.unsupported_language': 'Неподдерживаемый язык',
        'errors.validation_error': 'Ошибка валидации',
        'errors.request_not_found': 'Запрос не найден',
        'errors.already_paid': 'Уже оплачено',
        'errors.invalid_payment': 'Неверный платеж',
        'errors.template_not_found': 'Шаблон не найден',
        'errors.max_photos_reached': 'Достигнуто максимальное количество фото',
        'errors.invalid_file': 'Неверный файл',
        'errors.upload_failed': 'Ошибка загрузки',
        'common.continue': 'Продолжить',
        'common.upload_urls_generated': 'URL-адреса для загрузки созданы',
        'common.wait_time': 'Примерное время ожидания: {minutes} минут',
        'common.language_selected': 'Язык успешно обновлен',
        'payments.success': 'Платеж успешен',
        'payments.price_stars': '{stars} stars (${usd})',
        'payments.checkout_created': 'Сессия оплаты создана',
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

  t: jest.fn((key, variables = {}) => {
    let translation = key;
    Object.keys(variables).forEach((variable) => {
      translation = translation.replace(
        new RegExp(`{${variable}}`, 'g'),
        variables[variable]
      );
    });
    return translation;
  }),
};

module.exports = localeManager;
