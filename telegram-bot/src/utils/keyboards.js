const localeManager = require('../../../shared-locales');

class Keyboards {
  static progressBar(current, max, width = 10) {
    const percentage = Math.round((current / max) * 100);
    const filledBars = Math.round((percentage / 100) * width);
    const emptyBars = width - filledBars;
    return `[${'▓'.repeat(filledBars)}${'░'.repeat(emptyBars)}] ${percentage}%`;
  }

  static languageKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '🇺🇸 English', callback_data: 'lang_en' },
          { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
        ],
      ],
    };
  }

  static mainMenu(lang = 'en') {
    const t = (key, vars = {}) =>
      localeManager.translate(`common.${key}`, lang, vars);

    return {
      keyboard: [
        [{ text: t('menu.create_video') }],
        [{ text: t('menu.my_videos') }, { text: t('menu.status') }],
        [{ text: t('menu.language') }, { text: t('menu.help') }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    };
  }

  static photoContinue(photoCount, lang = 'en') {
    const text = localeManager.translate('common.photos.continue', lang, {
      count: photoCount,
    });
    return {
      inline_keyboard: [[{ text, callback_data: 'photos_continue' }]],
    };
  }

  static scriptOptions(lang = 'en') {
    const t = (key) => localeManager.translate(`common.${key}`, lang);
    return {
      inline_keyboard: [
        [{ text: t('script.skip'), callback_data: 'script_skip' }],
        [{ text: t('script.continue'), callback_data: 'script_input' }],
      ],
    };
  }

  static paymentConfirm(price, lang = 'en') {
    const t = (key, vars = {}) =>
      localeManager.translate(`common.${key}`, lang, vars);
    return {
      inline_keyboard: [
        [
          {
            text: t('payment.confirm', { price }),
            callback_data: 'payment_confirm',
          },
        ],
        [{ text: t('payment.cancel'), callback_data: 'payment_cancel' }],
      ],
    };
  }

  static backToMenu(lang = 'en') {
    const text = localeManager.translate('common.buttons.menu', lang);
    return {
      inline_keyboard: [[{ text, callback_data: 'main_menu' }]],
    };
  }

  static cancelButton(lang = 'en') {
    const text = localeManager.translate('common.buttons.cancel', lang);
    return {
      inline_keyboard: [[{ text, callback_data: 'cancel' }]],
    };
  }

  static retryButton(lang = 'en') {
    const text = localeManager.translate('common.buttons.retry', lang);
    return {
      inline_keyboard: [[{ text, callback_data: 'retry' }]],
    };
  }

  static backButton(lang = 'en') {
    const text = localeManager.translate('common.buttons.back', lang);
    return {
      inline_keyboard: [[{ text, callback_data: 'back' }]],
    };
  }
}

module.exports = Keyboards;
