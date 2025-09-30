const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const translationService = require('../services/translationService');

/**
 * Template model with translation support
 * Uses translations table for multi-language support
 */
const Template = sequelize.define(
  'Template',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Fallback name if translation not available',
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Fallback description if translation not available',
    },

    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'general',
    },

    duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },

    max_photos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'templates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

/**
 * Get localized template name
 * @param {string} language - Language code (en/ru)
 * @returns {Promise<string>} Localized name
 */
Template.prototype.getLocalizedName = async function (language = 'en') {
  try {
    const translation = await translationService.getTranslation(
      'template',
      this.id,
      'name',
      language
    );
    return translation || this.name || '';
  } catch (error) {
    console.error('Error getting localized name:', error);
    return this.name || '';
  }
};

/**
 * Get localized template description
 * @param {string} language - Language code (en/ru)
 * @returns {Promise<string>} Localized description
 */
Template.prototype.getLocalizedDescription = async function (language = 'en') {
  try {
    const translation = await translationService.getTranslation(
      'template',
      this.id,
      'description',
      language
    );
    return translation || this.description || '';
  } catch (error) {
    console.error('Error getting localized description:', error);
    return this.description || '';
  }
};

/**
 * Get complete localized template data
 * @param {string} language - Language code (en/ru)
 * @returns {Promise<object>} Localized template data
 */
Template.prototype.getLocalizedData = async function (language = 'en') {
  const [name, description] = await Promise.all([
    this.getLocalizedName(language),
    this.getLocalizedDescription(language),
  ]);

  return {
    id: this.id,
    name,
    description,
    category: this.category,
    duration_seconds: this.duration_seconds,
    max_photos: this.max_photos,
    is_active: this.is_active,
    sort_order: this.sort_order,
    usage_count: this.usage_count,
    created_at: this.created_at,
    updated_at: this.updated_at,
  };
};

/**
 * Get all templates with localized data
 * @param {string} language - Language code (en/ru)
 * @param {object} options - Sequelize find options
 * @returns {Promise<Array>} Array of localized templates
 */
Template.findLocalized = async function (language = 'en', options = {}) {
  const templates = await this.findAll({
    ...options,
    where: {
      is_active: true,
      ...options.where,
    },
    order: [
      ['sort_order', 'ASC'],
      ['created_at', 'DESC'],
    ],
  });

  const localizedTemplates = await Promise.all(
    templates.map((template) => template.getLocalizedData(language))
  );

  return localizedTemplates;
};

/**
 * Increment template usage count
 */
Template.prototype.incrementUsage = async function () {
  this.usage_count += 1;
  await this.save();
};

/**
 * Add or update translation for this template
 * @param {string} key - Translation key (name/description)
 * @param {string} language - Language code
 * @param {string} text - Translated text
 */
Template.prototype.setTranslation = async function (key, language, text) {
  await translationService.setTranslation(
    'template',
    this.id,
    key,
    language,
    text
  );
};

module.exports = Template;
