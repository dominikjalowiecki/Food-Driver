import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.mjs';

const MenuItem = sequelize.define(
  'MenuItem',
  {
    idMenuItem: {
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
    description: {
      type: DataTypes.STRING(3000),
      allowNull: false,
      validate: {
        len: [1, 3000],
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

export default MenuItem;
