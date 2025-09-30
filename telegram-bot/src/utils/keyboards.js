const i18nService = require('../config/i18n');

class Keyboards {
  /// Get progress bar
  static progressBar(current, max, width = 10) {
    const percentage = Math.round((current / max) * 100);
    const filledBars = Math.round((percentage / 100) * width);
    const emptyBars = width - filledBars;

    const bars = '▓'.repeat(filledBars);
    const spaces = '░'.repeat(emptyBars);

    return `[${bars}${spaces}] ${percentage}%`;
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

  static async mainMenu(lang = 'en') {
    const createVideo = await i18nService.translate('menu.create_video', lang);
    const myVideos = await i18nService.translate('menu.my_videos', lang);
    const language = await i18nService.translate('menu.language', lang);
    const help = await i18nService.translate('menu.help', lang);
    const status = await i18nService.translate('menu.status', lang);

    return {
      keyboard: [
        [{ text: createVideo }],
        [{ text: myVideos }, { text: status }],
        [{ text: language }, { text: help }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    };
  }

  static async photoContinue(photoCount, lang = 'en') {
    const continueText = await i18nService.translate('photos.continue', lang, {
      count: photoCount,
    });

    return {
      inline_keyboard: [
        [
          {
            text: continueText,
            callback_data: 'photos_continue',
          },
        ],
      ],
    };
  }

  static async scriptOptions(lang = 'en') {
    const skip = await i18nService.translate('script.skip', lang);
    const continueText = await i18nService.translate('script.continue', lang);

    return {
      inline_keyboard: [
        [{ text: skip, callback_data: 'script_skip' }],
        [{ text: continueText, callback_data: 'script_input' }],
      ],
    };
  }

  static async paymentConfirm(price, lang = 'en') {
    const confirm = await i18nService.translate('payment.confirm', lang, {
      price,
    });
    const cancel = await i18nService.translate('payment.cancel', lang);

    return {
      inline_keyboard: [
        [
          {
            text: confirm,
            callback_data: 'payment_confirm',
          },
        ],
        [
          {
            text: cancel,
            callback_data: 'payment_cancel',
          },
        ],
      ],
    };
  }

  static async backToMenu(lang = 'en') {
    const menu = await i18nService.translate('buttons.menu', lang);

    return {
      inline_keyboard: [[{ text: menu, callback_data: 'main_menu' }]],
    };
  }

  static async videoActions(hasVideo, lang = 'en') {
    const buttons = [];

    if (hasVideo) {
      const download = await i18nService.translate('my_videos.download', lang);
      buttons.push([{ text: download, callback_data: 'download_video' }]);
    }

    const back = await i18nService.translate('buttons.back', lang);
    const menu = await i18nService.translate('buttons.menu', lang);

    buttons.push([{ text: back, callback_data: 'my_videos' }]);
    buttons.push([{ text: menu, callback_data: 'main_menu' }]);

    return { inline_keyboard: buttons };
  }

  /**
   * Get translation function for specific language
   * @param {string} lang - Language code
   * @returns {Function} Async translation function
   */
  static getLocale(lang) {
    return async (key, variables = {}) => {
      return await i18nService.translate(key, lang, variables);
    };
  }

  // Get cancel button
  static async cancelButton(lang = 'en') {
    const cancel = await i18nService.translate('buttons.cancel', lang);

    return {
      inline_keyboard: [[{ text: cancel, callback_data: 'cancel' }]],
    };
  }

  // Get retry button
  static async retryButton(lang = 'en') {
    const retry = await i18nService.translate('buttons.retry', lang);

    return {
      inline_keyboard: [[{ text: retry, callback_data: 'retry' }]],
    };
  }

  // Get back button
  static async backButton(lang = 'en') {
    const back = await i18nService.translate('buttons.back', lang);

    return {
      inline_keyboard: [[{ text: back, callback_data: 'back' }]],
    };
  }
}

module.exports = Keyboards;
