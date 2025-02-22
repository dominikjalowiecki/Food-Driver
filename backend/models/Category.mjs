import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.mjs';

const Category = sequelize.define(
  'Category',
  {
    idCategory: {
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
  },
  {
    timestamps: false,
    indexes: [
      {
        type: 'UNIQUE',
        fields: ['name'],
      },
    ],
  }
);

export default Category;
