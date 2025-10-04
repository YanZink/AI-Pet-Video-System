const localeManager = require('../../../shared-locales');

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
    const createVideo = localeManager.translate(
      'telegram.menu.create_video',
      lang
    );
    const myVideos = localeManager.translate('telegram.menu.my_videos', lang);
    const language = localeManager.translate('telegram.menu.language', lang);
    const help = localeManager.translate('telegram.menu.help', lang);
    const status = localeManager.translate('telegram.menu.status', lang);

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
    const continueText = localeManager.translate(
      'telegram.photos.continue',
      lang,
      {
        count: photoCount,
      }
    );

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
    const skip = localeManager.translate('telegram.script.skip', lang);
    const continueText = localeManager.translate(
      'telegram.script.continue',
      lang
    );

    return {
      inline_keyboard: [
        [{ text: skip, callback_data: 'script_skip' }],
        [{ text: continueText, callback_data: 'script_input' }],
      ],
    };
  }

  static async paymentConfirm(price, lang = 'en') {
    const confirm = localeManager.translate('telegram.payment.confirm', lang, {
      price,
    });
    const cancel = localeManager.translate('telegram.payment.cancel', lang);

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
    const menu = localeManager.translate('telegram.buttons.menu', lang);

    return {
      inline_keyboard: [[{ text: menu, callback_data: 'main_menu' }]],
    };
  }

  static async videoActions(hasVideo, lang = 'en') {
    const buttons = [];

    if (hasVideo) {
      const download = localeManager.translate(
        'telegram.my_videos.download',
        lang
      );
      buttons.push([{ text: download, callback_data: 'download_video' }]);
    }

    const back = localeManager.translate('telegram.buttons.back', lang);
    const menu = localeManager.translate('telegram.buttons.menu', lang);

    buttons.push([{ text: back, callback_data: 'my_videos' }]);
    buttons.push([{ text: menu, callback_data: 'main_menu' }]);

    return { inline_keyboard: buttons };
  }

  static async cancelButton(lang = 'en') {
    const cancel = localeManager.translate('telegram.buttons.cancel', lang);

    return {
      inline_keyboard: [[{ text: cancel, callback_data: 'cancel' }]],
    };
  }

  static async retryButton(lang = 'en') {
    const retry = localeManager.translate('telegram.buttons.retry', lang);

    return {
      inline_keyboard: [[{ text: retry, callback_data: 'retry' }]],
    };
  }

  static async backButton(lang = 'en') {
    const back = localeManager.translate('telegram.buttons.back', lang);

    return {
      inline_keyboard: [[{ text: back, callback_data: 'back' }]],
    };
  }

  /**
   * Get simple inline keyboard with custom buttons
   */
  static inlineKeyboard(buttons, lang = 'en') {
    const keyboard = buttons.map((button) => {
      const translatedText = localeManager.translate(
        button.textKey,
        lang,
        button.variables
      );
      return [{ text: translatedText, callback_data: button.callbackData }];
    });

    return { inline_keyboard: keyboard };
  }
}

module.exports = Keyboards;
