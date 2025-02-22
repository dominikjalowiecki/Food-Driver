import express from 'express';
const router = express.Router();

import sequelize, { Op } from 'sequelize';
import createError from 'http-errors';
import currency from 'currency.js';
import authenticate from '../middlewares/authenticate.mjs';
import Order from '../models/Order.mjs';
import OrderItem from '../models/OrderItem.mjs';
import Restaurant from '../models/Restaurant.mjs';
import Category from '../models/Category.mjs';
import User from '../models/User.mjs';
import MenuItem from '../models/MenuItem.mjs';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.mjs';
import Message from '../models/Message.mjs';
import config from '../config.mjs';
import Image from '../models/Image.mjs';
import { sendNotification } from '../utils/index.mjs';

/* GET orders listing. */
router.get(
  '/',
  authenticate(['Administrator']),
  async function (req, res, next) {
    let { status, reported, page } = req.query;

    if (page) {
      page = parseInt(page);
    } else {
      page = 1;
    }

    const where = {};

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

/* POST create order. */
router.post('/', authenticate(), async function (req, res, next) {
  let { idUser } = req.user;
  let {
    idRestaurant,
    street,
    building,
    apartment,
    postalCode,
    city,
    menuItems,
    toPay,
  } = req.body;

  const restaurant = await Restaurant.findOne({
    where: {
      idRestaurant,
      name: {
        [Op.not]: null,
      },
    },
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

  if (!restaurant) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  const user = await User.findOne({
    where: {
      idUser,
    },
  });

  if (!street || !building || !apartment || !postalCode || !city) {
    street = user.street;
    building = user.building;
    apartment = user.apartment;
    postalCode = user.postalCode;
    city = user.city;
  }

  if (!menuItems) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  let backToPay = currency(0);

  const orderItems = [];

  for (const menuItem of menuItems) {
    if (!menuItem.idMenuItem || !menuItem.quantity) {
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const foundMenuItem = await MenuItem.findOne({
      where: {
        idMenuItem: menuItem.idMenuItem,
      },
    });

    if (!foundMenuItem) {
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    backToPay = backToPay.add(
      currency(foundMenuItem.price).multiply(menuItem.quantity)
    );

    orderItems.push({
      name: foundMenuItem.name,
      quantity: menuItem.quantity,
      price: foundMenuItem.price,
      ImageIdImage: foundMenuItem.ImageIdImage,
      OrderIdOrder: null,
    });
  }

  if (backToPay.value !== currency(toPay).value) {
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

  let order;
  try {
    order = await Order.create({
      status: 'Nowe',
      street,
      building,
      city,
      postalCode,
      apartment,
      payment: backToPay,
      UserIdUser: user.idUser,
      RestaurantIdRestaurant: restaurant.idRestaurant,
      point: sequelize.fn('ST_GeomFromText', `POINT(${long} ${lat})`, 4326),
    });

    for (const orderItem of orderItems) {
      await OrderItem.create({
        ...orderItem,
        OrderIdOrder: order.idOrder,
      });
    }
  } catch (err) {
    console.error(err);
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  const notificationUser = await User.findOne({
    attributes: ['idUser', 'subscription'],
    where: {
      idUser: restaurant.UserIdUser,
    },
  });

  if (notificationUser.subscription) {
    try {
      await sendNotification(notificationUser.subscription, {
        notification: {
          title: 'Masz dostępne nowe zamówienie',
          data: {
            onActionClick: {
              default: {
                operation: 'openWindow',
                url: `/orders/${order.idOrder}`,
              },
            },
          },
        },
      });
    } catch (err) {
      console.error(err);
      await User.update(
        {
          subscription: null,
        },
        {
          where: {
            idUser: notificationUser.idUser,
          },
        }
      );
    }
  }

  return res.sendStatus(201);
});

/* GET get order details. */
router.get(
  '/:idOrder',
  authenticate(),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    let { idOrder } = req.params;

    idOrder = Number(idOrder);

    const order = await Order.findOne({
      attributes: [
        'idOrder',
        'status',
        'street',
        'building',
        'apartment',
        'postalCode',
        'city',
        'payment',
        'reported',
        'created',
      ],
      include: [
        {
          model: Restaurant,
          attributes: [
            'idRestaurant',
            'name',
            [sequelize.literal('`restaurant->Image`.`url`'), 'image'],
            'street',
            'building',
            'apartment',
            'postalCode',
            'city',
          ],
          as: 'restaurant',
          include: [
            {
              model: Category,
              attributes: ['idCategory', 'name'],
              as: 'category',
            },
            {
              model: Image,
              attributes: [],
            },
          ],
        },
        {
          model: User,
          attributes: ['idUser', 'name', 'surname'],
          as: 'client',
        },
        {
          model: User,
          attributes: ['idUser', 'name', 'surname'],
          as: 'deliverer',
        },
        {
          model: OrderItem,
          attributes: [
            'idOrderItem',
            'name',
            'quantity',
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
          as: 'orderItems',
        },
      ],
      where: {
        idOrder,
      },
    });

    if (!order) {
      return next(createError(404, 'Nie znaleziono żądanego zasobu'));
    }

    return res.json(order);
  }
);

/* GET list chat messages. */
router.get(
  '/:idOrder/chat',
  authenticate(),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    let { idOrder } = req.params;
    let { page } = req.query;

    idOrder = Number(idOrder);

    const order = await Order.findOne({
      where: {
        idOrder,
      },
    });

    if (!order) {
      return next(createError(404, 'Nie znaleziono żądanego zasobu'));
    }

    if (page) {
      page = parseInt(page);
    } else {
      page = 1;
    }

    const where = {
      OrderIdOrder: idOrder,
    };

    const count = await Message.count({
      where,
    });

    let pages = Math.ceil(count / config.pagination);
    if (pages === 0) {
      pages = 1;
    }

    if (!(page >= 1 && page <= pages)) {
      page = 1;
    }

    const messages = await Message.findAll({
      attributes: [
        'idMessage',
        'message',
        [sequelize.literal('`Image`.`url`'), 'image'],
        'type',
        'created',
      ],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: User,
          attributes: ['idUser', 'name', 'surname', 'role'],
          as: 'user',
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
      results: messages,
    });
  }
);

/* POST create chat message. */
router.post(
  '/:idOrder/chat',
  authenticate(),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    let { idUser } = req.user;
    let { idOrder } = req.params;
    const { message, idImage } = req.body;

    idOrder = Number(idOrder);

    if (!message) {
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    try {
      await Message.create({
        message,
        type: 'Wiadomość',
        ImageIdImage: idImage ?? null,
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

/* POST create order report. */
router.post(
  '/:idOrder/report',
  authenticate(),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    let { idUser } = req.user;
    let { idOrder } = req.params;
    const { message, idImage } = req.body;

    idOrder = Number(idOrder);

    if (!message) {
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    try {
      await Order.update(
        {
          reported: true,
        },
        {
          where: {
            idOrder,
          },
        }
      );

      await Message.create({
        message,
        type: 'Zgłoszenie',
        ImageIdImage: idImage ?? null,
        UserIdUser: idUser,
        OrderIdOrder: idOrder,
      });
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const order = await Order.findOne({
      attributes: ['idOrder'],
      include: [
        {
          model: Restaurant,
          attributes: ['UserIdUser'],
          as: 'restaurant',
        },
      ],
      where: {
        idOrder,
      },
    });

    const notificationUser = await User.findOne({
      attributes: ['idUser', 'subscription'],
      where: {
        idUser: order.restaurant.UserIdUser,
      },
    });

    if (notificationUser.subscription) {
      try {
        await sendNotification(notificationUser.subscription, {
          notification: {
            title: 'Masz nowe zgłoszenie dotyczące zamówienia',
            data: {
              onActionClick: {
                default: {
                  operation: 'openWindow',
                  url: `/orders/${order.idOrder}`,
                },
              },
            },
          },
        });
      } catch (err) {
        console.error(err);
        await User.update(
          {
            subscription: null,
          },
          {
            where: {
              idUser: notificationUser.idUser,
            },
          }
        );
      }
    }

    return res.sendStatus(204);
  }
);

/* POST cancel order. */
router.post(
  '/:idOrder/cancel',
  authenticate(),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    let { idUser } = req.user;
    let { idOrder } = req.params;

    idOrder = Number(idOrder);

    try {
      await Order.update(
        {
          status: 'Anulowane',
        },
        {
          where: {
            idOrder,
          },
        }
      );

      await Message.create({
        message: 'Zamówienie anulowane',
        type: 'Status',
        UserIdUser: idUser,
        OrderIdOrder: idOrder,
      });
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const order = await Order.findOne({
      attributes: ['idOrder', 'UserIdUser'],
      where: {
        idOrder,
      },
    });

    const notificationUser = await User.findOne({
      attributes: ['idUser', 'subscription'],
      where: {
        idUser: order.UserIdUser,
      },
    });

    if (notificationUser.subscription) {
      try {
        await sendNotification(notificationUser.subscription, {
          notification: {
            title: 'Twoje zamówienie zostało anulowane',
            data: {
              onActionClick: {
                default: {
                  operation: 'openWindow',
                  url: `/orders/${order.idOrder}`,
                },
              },
            },
          },
        });
      } catch (err) {
        console.error(err);
        await User.update(
          {
            subscription: null,
          },
          {
            where: {
              idUser: notificationUser.idUser,
            },
          }
        );
      }
    }

    return res.sendStatus(204);
  }
);

/* POST resign to deliver order. */
router.post(
  '/:idOrder/resign',
  authenticate(),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    let { idUser } = req.user;
    let { idOrder } = req.params;

    idOrder = Number(idOrder);

    try {
      await Order.update(
        {
          UserIdDeliverer: null,
        },
        {
          where: {
            idOrder,
          },
        }
      );

      await Message.create({
        message: 'Zrezygnowano z dostawy zamówienia',
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

/* POST accept order for realization. */
router.post(
  '/:idOrder/accept-for-realization',
  authenticate(),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    let { idUser } = req.user;
    let { idOrder } = req.params;

    idOrder = Number(idOrder);

    try {
      await Order.update(
        {
          status: 'Przyjęte do realizacji',
        },
        {
          where: {
            idOrder,
          },
        }
      );

      await Message.create({
        message: 'Zamówienie przyjęte do realizacji',
        type: 'Status',
        UserIdUser: idUser,
        OrderIdOrder: idOrder,
      });
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const order = await Order.findOne({
      attributes: ['idOrder', 'UserIdUser'],
      where: {
        idOrder,
      },
    });

    const notificationUser = await User.findOne({
      attributes: ['idUser', 'subscription'],
      where: {
        idUser: order.UserIdUser,
      },
    });

    if (notificationUser.subscription) {
      try {
        await sendNotification(notificationUser.subscription, {
          notification: {
            title: 'Twoje zamówienie zostało przyjęte do realizacji',
            data: {
              onActionClick: {
                default: {
                  operation: 'openWindow',
                  url: `/orders/${order.idOrder}`,
                },
              },
            },
          },
        });
      } catch (err) {
        console.error(err);
        await User.update(
          {
            subscription: null,
          },
          {
            where: {
              idUser: notificationUser.idUser,
            },
          }
        );
      }
    }

    return res.sendStatus(204);
  }
);

/* POST order ready for delivery. */
router.post(
  '/:idOrder/ready-for-delivery',
  authenticate(),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    let { idUser } = req.user;
    let { idOrder } = req.params;

    idOrder = Number(idOrder);

    try {
      await Order.update(
        {
          status: 'Gotowe do dostawy',
        },
        {
          where: {
            idOrder,
          },
        }
      );

      await Message.create({
        message: 'Zamówienie gotowe do dostawy',
        type: 'Status',
        UserIdUser: idUser,
        OrderIdOrder: idOrder,
      });
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const order = await Order.findOne({
      attributes: ['idOrder', 'UserIdDeliverer'],
      where: {
        idOrder,
      },
    });

    if (order.UserIdDeliverer) {
      const notificationUser = await User.findOne({
        attributes: ['idUser', 'subscription'],
        where: {
          idUser: order.UserIdDeliverer,
        },
      });

      if (notificationUser.subscription) {
        try {
          await sendNotification(notificationUser.subscription, {
            notification: {
              title: 'Twoja dostawa została przygotowana',
              data: {
                onActionClick: {
                  default: {
                    operation: 'openWindow',
                    url: `/orders/${order.idOrder}`,
                  },
                },
              },
            },
          });
        } catch (err) {
          console.error(err);
          await User.update(
            {
              subscription: null,
            },
            {
              where: {
                idUser: notificationUser.idUser,
              },
            }
          );
        }
      }
    }

    return res.sendStatus(204);
  }
);

/* POST order picked up for delivery. */
router.post(
  '/:idOrder/picked-up-for-delivery',
  authenticate(),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    let { idUser } = req.user;
    let { idOrder } = req.params;

    idOrder = Number(idOrder);

    try {
      await Order.update(
        {
          status: 'Odebrane do dostarczenia',
        },
        {
          where: {
            idOrder,
          },
        }
      );

      await Message.create({
        message: 'Zamówienie odebrane do dostarczenia',
        type: 'Status',
        UserIdUser: idUser,
        OrderIdOrder: idOrder,
      });
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const order = await Order.findOne({
      attributes: ['idOrder', 'UserIdUser'],
      where: {
        idOrder,
      },
    });

    const notificationUser = await User.findOne({
      attributes: ['idUser', 'subscription'],
      where: {
        idUser: order.UserIdUser,
      },
    });

    if (notificationUser.subscription) {
      try {
        await sendNotification(notificationUser.subscription, {
          notification: {
            title: 'Twoje zamówienie zostało odebrane do dostarczenia',
            data: {
              onActionClick: {
                default: {
                  operation: 'openWindow',
                  url: `/orders/${order.idOrder}`,
                },
              },
            },
          },
        });
      } catch (err) {
        console.error(err);
        await User.update(
          {
            subscription: null,
          },
          {
            where: {
              idUser: notificationUser.idUser,
            },
          }
        );
      }
    }

    return res.sendStatus(204);
  }
);

/* POST order delivered. */
router.post(
  '/:idOrder/delivered',
  authenticate(),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    let { idUser } = req.user;
    let { idOrder } = req.params;
    let { idImage } = req.body;

    idOrder = Number(idOrder);

    if (!idImage) {
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    try {
      await Order.update(
        {
          status: 'Dostarczone',
        },
        {
          where: {
            idOrder,
          },
        }
      );

      await Message.create({
        message: 'Zamówienie dostarczone',
        type: 'Status',
        ImageIdImage: idImage,
        UserIdUser: idUser,
        OrderIdOrder: idOrder,
      });
    } catch (err) {
      console.error(err);
      return next(createError(400, 'Nieprawidłowa treść żądania'));
    }

    const order = await Order.findOne({
      attributes: ['idOrder', 'UserIdUser'],
      where: {
        idOrder,
      },
    });

    const notificationUser = await User.findOne({
      attributes: ['idUser', 'subscription'],
      where: {
        idUser: order.UserIdUser,
      },
    });

    if (notificationUser.subscription) {
      try {
        await sendNotification(notificationUser.subscription, {
          notification: {
            title: 'Twoje zamówienie zostało dostarczone',
            data: {
              onActionClick: {
                default: {
                  operation: 'openWindow',
                  url: `/orders/${order.idOrder}`,
                },
              },
            },
          },
        });
      } catch (err) {
        console.error(err);
        await User.update(
          {
            subscription: null,
          },
          {
            where: {
              idUser: notificationUser.idUser,
            },
          }
        );
      }
    }

    return res.sendStatus(204);
  }
);

/* POST order realized. */
router.post(
  '/:idOrder/realized',
  authenticate(),
  validateIdMiddleware('idOrder'),
  async function (req, res, next) {
    let { idUser } = req.user;
    let { idOrder } = req.params;

    idOrder = Number(idOrder);

    try {
      await Order.update(
        {
          status: 'Zrealizowane',
        },
        {
          where: {
            idOrder,
          },
        }
      );

      await Message.create({
        message: 'Zamówienie zrealizowane',
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
