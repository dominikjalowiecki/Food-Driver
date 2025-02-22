import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.mjs';

const Message = sequelize.define(
  'Message',
  {
    idMessage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    message: {
      type: DataTypes.STRING(3000),
      allowNull: false,
      validate: {
        len: [1, 3000],
      },
    },
    type: {
      type: DataTypes.ENUM('Status', 'Zgłoszenie', 'Wiadomość'),
      allowNull: false,
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    timestamps: false,
  }
);

export default Message;
