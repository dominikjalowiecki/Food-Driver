import express from 'express';
import { fileURLToPath } from 'url';
import path from 'node:path';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import createError from 'http-errors';
import fs from 'node:fs/promises';
import config from './config.mjs';
import trimRequestData from './middlewares/trimRequestData.mjs';

import usersRouter from './routes/users.mjs';
import imagesRouter from './routes/images.mjs';
import restaurantsRouter from './routes/restaurants.mjs';
import categoriesRouter from './routes/categories.mjs';
import deliveriesRouter from './routes/deliveries.mjs';
import ordersRouter from './routes/orders.mjs';

import cronJob from './utils/jobs/cronJob.mjs';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origins: ['http://localhost:4200'],
  })
);
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(
  logger('dev', {
    skip: function (req, res) {
      return config.production ? res.statusCode < 400 : false;
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(trimRequestData);
app.use(
  fileUpload({
    limits: { fileSize: config.maxFileSize },
    limitHandler: function (req, res, next) {
      next(createError(400, 'Nieprawidłowa treść żądania'));
    },
  })
);

app.get('/api', async function (req, res) {
  const openapi = await fs.readFile(
    path.join(__dirname, 'openapi', 'openapi3_1.yaml')
  );

  res.type('yaml');
  res.send(openapi);
});

app.use('/api/users', usersRouter);
app.use('/api/images', imagesRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/orders', ordersRouter);

app.use('*', express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  next(createError(404, 'Nie znaleziono żądanego zasobu'));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  if (err.status) {
    res.status(Number(err.status)).json({
      message: err.message,
    });
  } else {
    res.status(500).json({
      message: 'Wystąpił wewnętrzny błąd serwera',
    });
  }
});

export default app;

cronJob.initJob();
