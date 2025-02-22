import sequelize from '../sequelize.mjs';
import Category from './Category.mjs';
import Image from './Image.mjs';
import User from './User.mjs';
import Restaurant from './Restaurant.mjs';
import Order from './Order.mjs';
import Message from './Message.mjs';
import MenuItem from './MenuItem.mjs';
import OrderItem from './OrderItem.mjs';

(async () => {
  Category.hasMany(Restaurant);

  Image.hasMany(Message);
  Image.hasMany(OrderItem);
  Image.hasMany(MenuItem);
  Image.hasMany(Restaurant);

  MenuItem.belongsTo(Image);
  MenuItem.belongsTo(Restaurant);

  Message.belongsTo(User, {
    as: 'user',
    foreignKey: 'UserIdUser',
  });
  Message.belongsTo(Order);
  Message.belongsTo(Image);

  Order.belongsTo(User, { as: 'client', foreignKey: 'UserIdUser' });
  Order.hasMany(Message);
  Order.hasMany(OrderItem, {
    as: 'orderItems',
  });
  Order.belongsTo(Restaurant, {
    as: 'restaurant',
    foreignKey: 'RestaurantIdRestaurant',
  });
  Order.belongsTo(User, {
    as: 'deliverer',
    foreignKey: 'UserIdDeliverer',
  });

  OrderItem.belongsTo(Order);
  OrderItem.belongsTo(Image);

  Restaurant.belongsTo(Category, {
    as: 'category',
    foreignKey: 'CategoryIdCategory',
  });
  Restaurant.belongsTo(Image);
  Restaurant.hasMany(MenuItem, {
    as: 'menu',
  });
  Restaurant.hasMany(Order);
  Restaurant.belongsTo(User);

  User.hasMany(Order);
  User.hasMany(Message);
  User.hasMany(Restaurant);
  User.hasMany(Order, {
    foreignKey: 'UserIdDeliverer',
  });

  await sequelize.sync();
})();
