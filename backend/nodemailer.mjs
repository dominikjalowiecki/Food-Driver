import nodemailer from 'nodemailer';
import config from './config.mjs';

const { mail } = config;

const transporter = nodemailer.createTransport(mail);

export default transporter;
