import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.mjs';

const User = sequelize.define(
  'User',
  {
    idUser: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    surname: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    email: {
      type: DataTypes.STRING(320),
      allowNull: false,
      validate: {
        isEmail: true,
        len: [1, 320],
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    street: {
      type: DataTypes.STRING(200),
      validate: {
        len: [1, 200],
      },
    },
    building: {
      type: DataTypes.STRING(200),
      validate: {
        len: [1, 200],
      },
    },
    apartment: {
      type: DataTypes.STRING(200),
      validate: {
        len: [1, 200],
      },
    },
    postalCode: {
      type: DataTypes.STRING,
      validate: {
        is: [/^\d{2}-\d{3}$/],
      },
    },
    city: {
      type: DataTypes.STRING(200),
      validate: {
        len: [1, 200],
      },
    },
    role: {
      type: DataTypes.ENUM(
        'Klient',
        'Restaurator',
        'Dostawca',
        'Administrator'
      ),
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    activated: {
      type: DataTypes.DATE,
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
    subscription: {
      type: DataTypes.JSON,
    },
  },
  {
    timestamps: false,
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['surname'],
      },
      {
        type: 'UNIQUE',
        fields: ['email'],
      },
    ],
  }
);

export default User;
