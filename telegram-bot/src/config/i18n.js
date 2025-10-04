const localeManager = require('../../../shared-locales');

class TelegramI18n {
  static getT(language = 'en') {
    return (key, variables = {}) => {
      const translation = localeManager.translate(
        `common.${key}`,
        language,
        variables
      );
      return translation === `common.${key}` ? key : translation;
    };
  }

  static translate(key, language = 'en', variables = {}) {
    return this.getT(language)(key, variables);
  }
}

module.exports = TelegramI18n;
