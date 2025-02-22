import express from 'express';
const router = express.Router();

import sequelize, { Op } from 'sequelize';
import createError from 'http-errors';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';
import Restaurant from '../models/Restaurant.mjs';
import Category from '../models/Category.mjs';
import Order from '../models/Order.mjs';
import Image from '../models/Image.mjs';
import MenuItem from '../models/MenuItem.mjs';
import authenticate from '../middlewares/authenticate.mjs';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.mjs';
import config from '../config.mjs';
import {
  sendActivationEmail,
  sendResetPasswordEmail,
  generateUserTokens,
} from '../utils/index.mjs';
import TokenType from '../utils/tokenTypeEnum.mjs';

/* GET users listing. */
router.get(
  '/',
  authenticate(['Administrator']),
  async function (req, res, next) {
    let { search, page } = req.query;

    if (page) {
      page = parseInt(page);
    } else {
      page = 1;
    }

    const where = {};

    if (search) {
      where[Op.or] = {
        name: {
          [Op.like]: `%${search}%`,
        },
        surname: {
          [Op.like]: `%${search}%`,
        },
        email: {
          [Op.like]: `%${search}%`,
        },
      };
    }

    const count = await User.count({
      where,
    });

    let pages = Math.ceil(count / config.pagination);
    if (pages === 0) {
      pages = 1;
    }

    if (!(page >= 1 && page <= pages)) {
      page = 1;
    }

    const users = await User.findAll({
      attributes: [
        'idUser',
        'name',
        'surname',
        'email',
        'role',
        'active',
        'activated',
        'created',
      ],
      where,
      order: [
        ['name', 'ASC'],
        ['surname', 'ASC'],
      ],
      limit: config.pagination,
      offset: config.pagination * (page - 1),
    });

    return res.json({
      count,
      pages,
      currentPage: page,
      results: users,
    });
  }
);

/* PATCH update user details. */
router.patch(
  '/:idUser',
  authenticate(['Administrator']),
  validateIdMiddleware('idUser'),
  async function (req, res, next) {
    let { idUser } = req.params;
    idUser = Number(idUser);
    const { role, active } = req.body;

    try {
      await User.update(
        {
          role,
          active,
        },
        {
          where: {
            idUser,
          },
        }
      );

      if (role === 'Restaurator') {
        const restaurant = await Restaurant.findOne({
          where: {
            UserIdUser: idUser,
          },
        });
        if (!restaurant) {
          await Restaurant.create({
            point: sequelize.fn('ST_GeomFromText', `POINT(0 0)`, 4326),
            UserIdUser: idUser,
          });
        }
      }
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    return res.sendStatus(204);
  }
);

/* POST sign-up user. */
router.post('/sign-up', async function (req, res, next) {
  const { name, surname, email, confirmEmail, password, confirmPassword } =
    req.body;

  if (
    !name ||
    !surname ||
    !email ||
    !confirmEmail ||
    !password ||
    !confirmPassword
  ) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (user) {
    return next(createError(400, 'Podany adres email jest już wykorzystywany'));
  }

  if (email !== confirmEmail) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  if (password !== confirmPassword) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  const hash = await argon2.hash(password);

  try {
    const user = await User.create({
      name,
      surname,
      email,
      password: hash,
      role: 'Klient',
    });

    await sendActivationEmail(user);
  } catch (err) {
    console.error(err);
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  return res.status(201).json({
    message:
      'Pomyślnie zarejestrowano konto w systemie. Sprawdź skrzynkę pocztową w poszukiwaniu wiadomości aktywacyjnej.',
  });
});

/* POST sign-in user. */
router.post('/sign-in', async function (req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    return next(createError(400, 'Nieprawidłowe dane logowania'));
  }

  let passwordValid = false;

  try {
    if (await argon2.verify(user.password, password)) {
      passwordValid = true;
    }
  } catch (err) {
    console.error(err);
  }

  if (!passwordValid) {
    return next(createError(400, 'Nieprawidłowe dane logowania'));
  }

  if (!user.active) {
    if (user.activated) {
      return next(createError(400, 'Konto jest nieaktywne'));
    } else {
      await sendActivationEmail(user);
      return next(
        createError(
          400,
          'Aby się zalogować należy aktywować konto. Sprawdź skrzynkę pocztową w poszukiwaniu wiadomości aktywacyjnej.'
        )
      );
    }
  }

  const tokens = generateUserTokens(user);

  return res.json(tokens);
});

/* POST refresh tokens. */
router.post('/refresh', async function (req, res, next) {
  const { refreshToken } = req.body;

  let tokenPayload;
  try {
    tokenPayload = jwt.verify(refreshToken, config.jwt.secret);
  } catch (err) {
    console.error(err);
    return next(createError(400, 'Nieprawidłowy token odświeżania'));
  }

  const { idUser, tokenType } = tokenPayload;

  if (tokenType !== TokenType.REFRESH) {
    return next(createError(400, 'Nieprawidłowy token odświeżania'));
  }

  const user = await User.findOne({
    where: {
      idUser,
    },
  });

  if (!user) {
    return next(createError(400, 'Konto nie istnieje'));
  }

  if (!user.active) {
    return next(createError(400, 'Konto jest nieaktywne'));
  }

  const tokens = generateUserTokens(user);

  return res.json(tokens);
});

/* POST activate user. */
router.post('/activate', async function (req, res, next) {
  const { token } = req.body;

  let tokenPayload;
  try {
    tokenPayload = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    console.error(err);
    return next(createError(400, 'Nieprawidłowy token aktywacyjny'));
  }

  const { idUser, tokenType } = tokenPayload;

  if (tokenType !== TokenType.ACTIVATION) {
    return next(createError(400, 'Nieprawidłowy token aktywacyjny'));
  }

  await User.update(
    {
      active: true,
      activated: sequelize.literal('CURRENT_TIMESTAMP'),
    },
    {
      where: {
        idUser,
      },
    }
  );

  return res.json({
    message: 'Konto użytkownika zostało aktywowane',
  });
});

/* POST reset password. */
router.post('/reset-password', async function (req, res, next) {
  const { email } = req.body;

  if (!email) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (user) {
    await sendResetPasswordEmail(user);
  }

  return res.json({
    message:
      'Sprawdź skrzynkę pocztową w poszukiwaniu wiadomości do resetu hasła',
  });
});

/* POST confirm password reset. */
router.post('/reset-password/confirm', async function (req, res, next) {
  const { token, password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  let tokenPayload;
  try {
    tokenPayload = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    console.error(err);
    return next(createError(400, 'Nieprawidłowy token resetu hasła'));
  }

  const { idUser, tokenType } = tokenPayload;

  if (tokenType !== TokenType.RESET_PASSWORD) {
    return next(createError(400, 'Nieprawidłowy token resetu hasła'));
  }

  if (password !== confirmPassword) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  const hash = await argon2.hash(password);

  await User.update(
    {
      password: hash,
    },
    {
      where: {
        idUser,
      },
    }
  );

  return res.json({
    message: 'Pomyślnie zresetowano hasło do konta',
  });
});

/* GET get currently logged in user details. */
router.get('/me', authenticate(), async function (req, res, next) {
  const { idUser, role } = req.user;

  const user = await User.findOne({
    attributes: [
      'idUser',
      'name',
      'surname',
      'email',
      'street',
      'building',
      'apartment',
      'postalCode',
      'city',
      'role',
      'created',
    ],
    where: {
      idUser,
    },
  });

  if (!user) {
    return next(createError(401, 'Konto nie istnieje'));
  }

  user.role = role;

  return res.json(user);
});

/* POST subscribe to PUSH notifications. */
router.post('/me/subscribe', authenticate(), async function (req, res, next) {
  const { idUser } = req.user;
  const subscription = req.body;

  if (!subscription) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  try {
    await User.update(
      {
        subscription,
      },
      {
        where: {
          idUser,
        },
      }
    );
  } catch (err) {
    console.error(err);
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  return res.sendStatus(204);
});

/* PUT update currently logged in user details. */
router.put('/me', authenticate(), async function (req, res, next) {
  const { idUser } = req.user;
  const { name, surname, street, building, apartment, postalCode, city } =
    req.body;

  if (
    !name ||
    !surname ||
    !street ||
    !building ||
    !apartment ||
    !postalCode ||
    !city
  ) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  try {
    await User.update(
      {
        name,
        surname,
        street,
        building,
        apartment,
        postalCode,
        city,
      },
      {
        where: {
          idUser,
        },
      }
    );
  } catch (err) {
    console.error(err);
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  return res.sendStatus(204);
});

/* POST change password of currently logged in user. */
router.post(
  '/me/change-password',
  authenticate(),
  async function (req, res, next) {
    const { idUser } = req.user;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const user = await User.findOne({
      where: {
        idUser,
      },
    });

    if (!user) {
      return next(createError(401, 'Konto nie istnieje'));
    }

    let passwordValid = false;

    try {
      if (await argon2.verify(user.password, currentPassword)) {
        passwordValid = true;
      }
    } catch (err) {
      console.error(err);
    }

    if (!passwordValid) {
      return next(createError(400, 'Nieprawidłowe bieżące hasło'));
    }

    if (newPassword !== confirmNewPassword) {
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const hash = await argon2.hash(newPassword);

    await User.update(
      {
        password: hash,
      },
      {
        where: {
          idUser,
        },
      }
    );

    return res.sendStatus(204);
  }
);

/* GET get currently logged in user orders. */
router.get('/me/orders', authenticate(), async function (req, res, next) {
  let { status, reported, page } = req.query;
  const { idUser } = req.user;

  if (page) {
    page = parseInt(page);
  } else {
    page = 1;
  }

  const where = {
    UserIdUser: idUser,
  };

  if (status) {
    where.status = status;
  }

  if (reported) {
    if (reported === 'true') {
      where.reported = true;
    } else {
      where.reported = false;
    }
  }

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

  const orders = await Order.findAll({
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
    order: [['created', 'DESC']],
    limit: config.pagination,
    offset: config.pagination * (page - 1),
  });

  return res.json({
    count,
    pages,
    currentPage: page,
    results: orders,
  });
});

/* GET get currently logged in user restaurant orders. */
router.get(
  '/me/restaurant/orders',
  authenticate(['Restaurator']),
  async function (req, res, next) {
    let { status, reported, page } = req.query;
    const { idUser } = req.user;

    if (page) {
      page = parseInt(page);
    } else {
      page = 1;
    }

    const restaurant = await Restaurant.findOne({
      where: {
        UserIdUser: idUser,
      },
    });

    const where = {
      RestaurantIdRestaurant: restaurant.idRestaurant,
    };

    if (status) {
      where.status = status;
    }

    if (reported) {
      if (reported === 'true') {
        where.reported = true;
      } else {
        where.reported = false;
      }
    }

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

    const orders = await Order.findAll({
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
      order: [['created', 'DESC']],
      limit: config.pagination,
      offset: config.pagination * (page - 1),
    });

    return res.json({
      count,
      pages,
      currentPage: page,
      results: orders,
    });
  }
);

/* GET get currently logged in user restaurant details. */
router.get(
  '/me/restaurant',
  authenticate(['Restaurator']),
  async function (req, res, next) {
    const { idUser } = req.user;

    const restaurant = await Restaurant.findOne({
      attributes: [
        'idRestaurant',
        'name',
        'description',
        [sequelize.literal('`Image`.`idImage`'), 'idImage'],
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
            [sequelize.literal('`Image`.`idImage`'), 'idImage'],
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
      ],
      where: {
        UserIdUser: idUser,
      },
    });

    return res.json(restaurant);
  }
);

/* PUT update currently logged in user restaurant details. */
router.put(
  '/me/restaurant',
  authenticate(['Restaurator']),
  async function (req, res, next) {
    const { idUser } = req.user;
    const {
      name,
      description,
      idCategory,
      idImage,
      street,
      building,
      apartment,
      postalCode,
      city,
    } = req.body;

    if (
      !name ||
      !description ||
      !idCategory ||
      !idImage ||
      !street ||
      !building ||
      !apartment ||
      !postalCode ||
      !city
    ) {
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const result = await fetch(
      `${config.googleGeocodingApi.url}?address=${street} ${building} ${apartment}, ${city} ${postalCode}&components=country:PL&key=${config.googleGeocodingApi.key}`
    );

    const text = await result.text();

    if (!result?.ok) {
      throw new Error(text);
    }

    const json = JSON.parse(text);

    if (['OVER_DAILY_LIMIT', 'OVER_QUERY_LIMIT'].includes(json.status)) {
      return next(createError(500, 'Wystąpił wewnętrzny błąd serwera'));
    }

    if (
      json.status !== 'OK'
      // || json.results[0]?.types[0] !== 'street_address'
    ) {
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const location = json.results[0].geometry.location;

    const lat = location.lat;
    const long = location.lng;

    try {
      await Restaurant.update(
        {
          name,
          description,
          CategoryIdCategory: idCategory,
          ImageIdImage: idImage,
          street,
          building,
          apartment,
          postalCode,
          city,
          point: sequelize.fn('ST_GeomFromText', `POINT(${long} ${lat})`, 4326),
        },
        {
          where: {
            UserIdUser: idUser,
          },
        }
      );
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    return res.sendStatus(204);
  }
);

/* POST create currently logged in user restaurant menu item. */
router.post(
  '/me/restaurant/menu-items',
  authenticate(['Restaurator']),
  async function (req, res, next) {
    const { idUser } = req.user;
    const { name, description, price, idImage } = req.body;

    if (!name || !description || !price || !idImage) {
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const restaurant = await Restaurant.findOne({
      where: {
        UserIdUser: idUser,
      },
    });

    try {
      await MenuItem.create({
        name,
        description,
        price,
        ImageIdImage: idImage,
        RestaurantIdRestaurant: restaurant.idRestaurant,
      });
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    return res.sendStatus(201);
  }
);

/* PUT update currently logged in user restaurant menu item. */
router.put(
  '/me/restaurant/menu-items/:idMenuItem',
  authenticate(['Restaurator']),
  validateIdMiddleware('idMenuItem'),
  async function (req, res, next) {
    let { idMenuItem } = req.params;
    idMenuItem = Number(idMenuItem);
    const { idUser } = req.user;
    const { name, description, price, idImage } = req.body;

    if (!name || !description || !price || !idImage) {
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const restaurant = await Restaurant.findOne({
      where: {
        UserIdUser: idUser,
      },
    });

    try {
      await MenuItem.update(
        {
          name,
          description,
          price,
          ImageIdImage: idImage,
        },
        {
          where: {
            idMenuItem,
            RestaurantIdRestaurant: restaurant.idRestaurant,
          },
        }
      );
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    return res.sendStatus(204);
  }
);

/* DELETE delete currently logged in user restaurant menu item. */
router.delete(
  '/me/restaurant/menu-items/:idMenuItem',
  authenticate(['Restaurator']),
  validateIdMiddleware('idMenuItem'),
  async function (req, res, next) {
    let { idMenuItem } = req.params;
    idMenuItem = Number(idMenuItem);
    const { idUser } = req.user;

    const restaurant = await Restaurant.findOne({
      where: {
        UserIdUser: idUser,
      },
    });

    try {
      await MenuItem.destroy({
        where: {
          idMenuItem,
          RestaurantIdRestaurant: restaurant.idRestaurant,
        },
      });
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    return res.sendStatus(204);
  }
);

/* GET get currently logged in user deliveries. */
router.get(
  '/me/deliveries',
  authenticate(['Dostawca']),
  async function (req, res, next) {
    let { status, reported, page } = req.query;
    const { idUser } = req.user;

    if (page) {
      page = parseInt(page);
    } else {
      page = 1;
    }

    const where = {
      UserIdDeliverer: idUser,
    };

    if (status) {
      where.status = status;
    }

    if (reported) {
      if (reported === 'true') {
        where.reported = true;
      } else {
        where.reported = false;
      }
    }

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

    const orders = await Order.findAll({
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
      order: [['created', 'DESC']],
      limit: config.pagination,
      offset: config.pagination * (page - 1),
    });

    return res.json({
      count,
      pages,
      currentPage: page,
      results: orders,
    });
  }
);

export default router;
