import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.mjs';

const Image = sequelize.define(
  'Image',
  {
    idImage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    url: {
      type: DataTypes.STRING(2048),
      allowNull: false,
      validate: {
        len: [1, 2048],
      },
    },
  },
  {
    timestamps: false,
    indexes: [
      {
        type: 'UNIQUE',
        fields: ['url'],
      },
    ],
  }
);

export default Image;
