const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// Import models
const User = require('./User')(sequelize);
const GeneratedContent = require('./GeneratedContent')(sequelize);

// Define associations
User.hasMany(GeneratedContent, { foreignKey: 'userId' });
GeneratedContent.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  GeneratedContent
};
