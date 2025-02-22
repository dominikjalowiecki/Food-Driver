import { Ajv } from 'ajv';
import webpush from 'web-push';
import jwt from 'jsonwebtoken';
import config from '../config.mjs';
import TokenType from './tokenTypeEnum.mjs';
import transporter from '../nodemailer.mjs';
import '../models/init-models.mjs';

export function trimStringProperties(object) {
  if (object !== null && typeof object === 'object') {
    for (const [key, value] of Object.entries(object)) {
      if (typeof value === 'object') {
        trimStringProperties(value);
      }

      if (typeof value === 'string') {
        object[key] = value.trim();
      }
    }
  }
}

export const idValidationSchema = {
  type: 'integer',
  minimum: 0,
  maximum: 2147483647,
};

export const emailValidationSchema = {
  type: 'string',
  pattern:
    "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$",
  maxLength: 320,
};

export const pageValidationSchema = {
  type: 'integer',
  minimum: 1,
  maximum: 2147483647,
};

export function validateId(id) {
  return validate(idValidationSchema, id);
}

export function validatePage(page) {
  return validate(pageValidationSchema, page);
}

function validate(schema, value) {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(value);

  return valid;
}

webpush.setVapidDetails(
  `mailto:${config.adminMail}`,
  config.vapidKeys.publicKey,
  config.vapidKeys.privateKey
);

export async function sendNotification(subscription, data) {
  await webpush.sendNotification(subscription, JSON.stringify(data));
}

export async function sendActivationEmail(user) {
  const tokenPayload = {
    idUser: user.idUser,
    tokenType: TokenType.ACTIVATION,
  };

  const token = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.activationTokenExpirationTime,
  });

  const link = `${config.frontendBaseUrl}/activate/${token}`;

  const info = await transporter.sendMail({
    from: `"Food Driver" <${config.mail.auth.user}>`,
    to: user.email,
    subject: 'Aktywacja konta w systemie',
    text: `Aktywuj konto klikając w link: ${link}`,
    html: `<p>Aktywuj konto klikając w link: <a href="${link}" target="_blank">Kliknij tutaj</a></p>`,
  });

  console.log('Message sent:', info);
}

export async function sendResetPasswordEmail(user) {
  const tokenPayload = {
    idUser: user.idUser,
    tokenType: TokenType.RESET_PASSWORD,
  };

  const token = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.resetPasswordTokenExpirationTime,
  });

  const link = `${config.frontendBaseUrl}/reset-password/confirm/${token}`;

  const info = await transporter.sendMail({
    from: `"Food Driver" <${config.mail.auth.user}>`,
    to: user.email,
    subject: 'Reset hasła do konta w systemie',
    text: `Zresetuj hasło do konta klikając w link: ${link}`,
    html: `<p>Zresetuj hasło do konta klikając w link: <a href="${link}" target="_blank">Kliknij tutaj</a></p>`,
  });

  console.log('Message sent:', info);
}

export function generateUserTokens(user) {
  const authenticationToken = jwt.sign(
    {
      user: {
        idUser: user.idUser,
        role: user.role,
      },
      tokenType: TokenType.AUTHENTICATION,
    },
    config.jwt.secret,
    {
      algorithm: 'HS384',
      expiresIn: config.jwt.authenticationTokenExpirationTime,
    }
  );

  const refreshToken = jwt.sign(
    {
      idUser: user.idUser,
      tokenType: TokenType.REFRESH,
    },
    config.jwt.secret,
    {
      algorithm: 'HS384',
      expiresIn: config.jwt.refreshTokenExpirationTime,
    }
  );

  return {
    authenticationToken,
    refreshToken,
  };
}
