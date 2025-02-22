import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.mjs';

const Order = sequelize.define(
  'Order',
  {
    idOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM(
        'Nowe',
        'Przyjęte do realizacji',
        'Gotowe do dostawy',
        'Odebrane do dostarczenia',
        'Dostarczone',
        'Zrealizowane',
        'Anulowane'
      ),
      allowNull: false,
    },
    street: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    building: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    city: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: [/^\d{2}-\d{3}$/],
      },
    },
    apartment: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    reported: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    payment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
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
        fields: ['status'],
      },
      {
        fields: ['reported'],
      },
      {
        type: 'SPATIAL',
        fields: ['point'],
      },
    ],
  }
);

export default Order;
