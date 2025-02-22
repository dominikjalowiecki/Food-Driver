import express from 'express';
const router = express.Router();

import sequelize, { Op } from 'sequelize';
import createError from 'http-errors';
import authenticate from '../middlewares/authenticate.mjs';
import Order from '../models/Order.mjs';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.mjs';
import config from '../config.mjs';
import Restaurant from '../models/Restaurant.mjs';
import Category from '../models/Category.mjs';
import Message from '../models/Message.mjs';

/* GET deliveries listing. */
router.get('/', authenticate(), async function (req, res, next) {
  let { lat, long, distance, page } = req.query;

  lat = Number(lat);
  long = Number(long);
  distance = Number(distance);

  if (page) {
    page = parseInt(page);
  } else {
    page = 1;
  }

  if (isNaN(lat) || isNaN(long)) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  if (isNaN(distance) || distance < 1000 || distance > 25000) {
    distance = 5000;
  }

  const where = {
    [Op.and]: [
      sequelize.literal(
        `ST_distance_sphere(\`Order\`.\`point\`, ST_GeomFromText('POINT(${long} ${lat})', 4326)) <= ${distance}`
      ),
    ],
    UserIdDeliverer: {
      [Op.is]: null,
    },
  };

  const count = await Order.count({
    where,
  });

  let pages = Math.ceil(count / config.pagination);
  if (pages === 0) {
    pages = 1;
  }

  if (!(page >= 1 && page <= pages)) {
    page = 1;
  }

  const deliveries = await Order.findAll({
    attributes: ['idOrder', 'status', 'payment', 'reported', 'created'],
    include: [
      {
        model: Restaurant,
        attributes: ['idRestaurant', 'name'],
        include: [
          {
            model: Category,
            attributes: ['idCategory', 'name'],
            as: 'category',
          },
        ],
        as: 'restaurant',
      },
    ],
    where,
    order: [['created', 'ASC']],
    limit: config.pagination,
    offset: config.pagination * (page - 1),
  });

  return res.json({
    count,
    pages,
    currentPage: page,
    results: deliveries,
  });
});

/* POST realize delivery. */
router.post(
  '/:idOrder/realize',
  authenticate(['Dostawca']),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    const { idUser } = req.user;
    let { idOrder } = req.params;

    idOrder = Number(idOrder);

    try {
      await Order.update(
        {
          UserIdDeliverer: idUser,
        },
        {
          where: {
            idOrder,
            UserIdDeliverer: {
              [Op.is]: null,
            },
          },
        }
      );

      await Message.create({
        message: 'Przyjęto zamówienie do dostarczenia',
        type: 'Status',
        UserIdUser: idUser,
        OrderIdOrder: idOrder,
      });
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    return res.sendStatus(204);
  }
);

export default router;
