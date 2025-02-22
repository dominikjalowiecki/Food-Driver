import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.mjs';

const Restaurant = sequelize.define(
  'Restaurant',
  {
    idRestaurant: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      validate: {
        len: [1, 200],
      },
    },
    description: {
      type: DataTypes.STRING(3000),
      validate: {
        len: [1, 3000],
      },
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
    point: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: false,
    },
  },
  {
    timestamps: false,
    indexes: [
      {
        type: 'UNIQUE',
        fields: ['name'],
      },
      {
        type: 'SPATIAL',
        fields: ['point'],
      },
    ],
  }
);

export default Restaurant;
