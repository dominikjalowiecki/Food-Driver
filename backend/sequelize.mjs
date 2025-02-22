import { Sequelize } from 'sequelize';
import config from './config.mjs';

const { host, database, user, password, timezone, logging } = config.database;

const sequelize = new Sequelize(database, user, password, {
  host,
  dialect: 'mariadb',
  dialectOptions: {
    useUTC: true,
  },
  // timezone,
  logging,
});

export default sequelize;
