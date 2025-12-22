const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50]
      }
    },
    hashedPassword: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['hashedPassword'] }
    },
    scopes: {
      withPassword: {
        attributes: {}
      }
    }
  });

  // Instance methods
  User.prototype.validatePassword = function(password) {
    return bcrypt.compare(password, this.hashedPassword);
  };

  User.prototype.toSafeObject = function() {
    const { id, email, username, createdAt } = this;
    return { id, email, username, createdAt };
  };

  // Class methods
  User.hashPassword = function(password) {
    return bcrypt.hashSync(password, 10);
  };

  User.login = async function({ email, password }) {
    const user = await User.scope('withPassword').findOne({
      where: { email }
    });

    if (user && await user.validatePassword(password)) {
      return await User.findByPk(user.id);
    }
    return null;
  };

  User.signup = async function({ email, username, password }) {
    const hashedPassword = User.hashPassword(password);
    const user = await User.create({
      email,
      username,
      hashedPassword
    });
    return await User.findByPk(user.id);
  };

  return User;
};
