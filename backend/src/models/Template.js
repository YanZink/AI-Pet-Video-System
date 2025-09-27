const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { SUPPORTED_LANGUAGES } = require('../utils/constants');

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
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    name_ru: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    name_en: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    description_ru: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    description_en: {
      type: DataTypes.TEXT,
      allowNull: true,
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

Template.prototype.getLocalizedName = function (language = 'en') {
  const nameField = `name_${language}`;
  return this[nameField] || this.name || '';
};

Template.prototype.incrementUsage = async function () {
  this.usage_count += 1;
  await this.save();
};

module.exports = Template;
