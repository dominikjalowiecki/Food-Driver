import express from 'express';
const router = express.Router();

import sequelize, { Op } from 'sequelize';
import createError from 'http-errors';
import Restaurant from '../models/Restaurant.mjs';
import Category from '../models/Category.mjs';
import User from '../models/User.mjs';
import MenuItem from '../models/MenuItem.mjs';
import Image from '../models/Image.mjs';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.mjs';
import config from '../config.mjs';

/* GET restaurants listing. */
router.get('/', async function (req, res, next) {
  let { lat, long, address, distance, idCategory, page } = req.query;

  lat = Number(lat);
  long = Number(long);
  distance = Number(distance);
  idCategory = Number(idCategory);

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
        `ST_distance_sphere(\`Restaurant\`.\`point\`, ST_GeomFromText('POINT(${long} ${lat})', 4326)) <= ${distance}`
      ),
    ],
    name: {
      [Op.not]: null,
    },
  };

  if (!isNaN(idCategory)) {
    where.CategoryIdCategory = idCategory;
  }

  const count = await Restaurant.count({
    where,
    include: [
      {
        model: User,
        attributes: [],
        where: {
          active: true,
        },
      },
    ],
  });

  let pages = Math.ceil(count / config.pagination);
  if (pages === 0) {
    pages = 1;
  }

  if (!(page >= 1 && page <= pages)) {
    page = 1;
  }

  const restaurants = await Restaurant.findAll({
    attributes: [
      'idRestaurant',
      'name',
      [sequelize.literal('`Image`.`url`'), 'image'],
    ],
    include: [
      {
        model: Image,
        attributes: [],
      },
      {
        model: Category,
        attributes: ['idCategory', 'name'],
        as: 'category',
      },
      {
        model: User,
        attributes: [],
        where: {
          active: true,
        },
      },
    ],
    where,
    order: [['name', 'ASC']],
    limit: config.pagination,
    offset: config.pagination * (page - 1),
  });

  return res.json({
    count,
    pages,
    currentPage: page,
    results: restaurants,
  });
});

/* GET get restaurant details. */
router.get(
  '/:idRestaurant',
  validateIdMiddleware('idRestaurant'),
  async function (req, res, next) {
    let { idRestaurant } = req.params;

    idRestaurant = Number(idRestaurant);

    const restaurant = await Restaurant.findOne({
      attributes: [
        'idRestaurant',
        'name',
        'description',
        [sequelize.literal('`Image`.`url`'), 'image'],
        'street',
        'building',
        'apartment',
        'postalCode',
        'city',
      ],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: Category,
          attributes: ['idCategory', 'name'],
          as: 'category',
        },
        {
          model: MenuItem,
          attributes: [
            'idMenuItem',
            'name',
            'description',
            'price',
            [sequelize.literal('`Image`.`url`'), 'image'],
          ],
          separate: true,
          include: [
            {
              model: Image,
              attributes: [],
            },
          ],
          order: [['name', 'ASC']],
          as: 'menu',
        },
        {
          model: User,
          attributes: [],
          where: {
            active: true,
          },
        },
      ],
      where: {
        idRestaurant,
        name: {
          [Op.not]: null,
        },
      },
    });

    if (!restaurant) {
      return next(createError(404, 'Nie znaleziono żądanego zasobu'));
    }

    return res.json(restaurant);
  }
);

export default router;
