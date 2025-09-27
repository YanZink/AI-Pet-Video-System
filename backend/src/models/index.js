const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Request = require('./Request');
const Template = require('./Template');

// Define model relationships
User.hasMany(Request, {
  foreignKey: 'user_id',
  as: 'requests',
});

Request.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Template.hasMany(Request, {
  foreignKey: 'template_id',
  as: 'requests',
});

Request.belongsTo(Template, {
  foreignKey: 'template_id',
  as: 'template',
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Request,
  Template,
};
