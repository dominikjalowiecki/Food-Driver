import CronJob from 'node-cron';
import { Op } from 'sequelize';
import config from '../../config.mjs';
import Message from '../../models/Message.mjs';
import Order from '../../models/Order.mjs';

async function cronJob() {
  try {
    const currentDate = new Date();

    const deliveredMessages = await Message.findAll({
      attributes: ['idMessage', 'created'],
      include: [
        {
          model: Order,
          attributes: ['idOrder'],
          where: {
            status: 'Dostarczone',
          },
        },
      ],
      where: {
        message: 'Zamówienie dostarczone',
        type: 'Status',
      },
      order: [['created', 'ASC']],
    });

    const readyForDeliveryMessages = await Message.findAll({
      attributes: ['idMessage', 'created'],
      include: [
        {
          model: Order,
          attributes: ['idOrder'],
          where: {
            status: 'Gotowe do dostawy',
            UserIdDeliverer: {
              [Op.not]: null,
            },
          },
        },
      ],
      where: {
        message: 'Przyjęto zamówienie do dostarczenia',
        type: 'Status',
      },
      order: [['created', 'ASC']],
    });

    for (const message of deliveredMessages) {
      const expiryDate = new Date(
        message.created.getTime() + config.expiryMinutes * 60000
      );

      if (currentDate >= expiryDate) {
        const { idOrder } = message.Order;

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
          message: 'Zamówienie zrealizowane automatycznie',
          type: 'Status',
          OrderIdOrder: idOrder,
        });
      } else {
        break;
      }
    }

    for (const message of readyForDeliveryMessages) {
      const expiryDate = new Date(
        message.created.getTime() + config.expiryMinutes * 60000
      );

      if (currentDate >= expiryDate) {
        const { idOrder } = message.Order;

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
          message: 'Automatycznie zrezygnowano z dostawy zamówienia',
          type: 'Status',
          OrderIdOrder: idOrder,
        });
      } else {
        break;
      }
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export default {
  initJob() {
    const job = CronJob.schedule('*/1 * * * *', cronJob);

    job.start();
  },
};
