const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const { SUPPORTED_LANGUAGES, USER_ROLES } = require('../utils/constants');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    telegram_id: {
      type: DataTypes.BIGINT,
      unique: true,
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },

    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    password_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    language: {
      type: DataTypes.ENUM(Object.values(SUPPORTED_LANGUAGES)),
      defaultValue: SUPPORTED_LANGUAGES.EN,
    },

    role: {
      type: DataTypes.ENUM(Object.values(USER_ROLES)),
      defaultValue: USER_ROLES.USER,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    login_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    validate: {
      eitherTelegramOrEmail() {
        if (!this.telegram_id && !this.email) {
          throw new Error('User must have either telegram_id or email');
        }
      },
    },

    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      },

      beforeUpdate: async (user) => {
        if (user.changed('password_hash') && user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      },
    },
  }
);

User.prototype.checkPassword = async function (password) {
  if (!this.password_hash) return false;
  return await bcrypt.compare(password, this.password_hash);
};

User.prototype.getPublicData = function () {
  const publicData = { ...this.toJSON() };
  delete publicData.password_hash;
  return publicData;
};

User.prototype.isAdmin = function () {
  return this.role === USER_ROLES.ADMIN;
};

User.findByTelegramId = async function (telegramId) {
  return await this.findOne({
    where: { telegram_id: telegramId, is_active: true },
  });
};

User.findByEmail = async function (email) {
  return await this.findOne({
    where: { email: email.toLowerCase(), is_active: true },
  });
};

module.exports = User;
