import 'dotenv/config';

const {
  PORT,
  FRONTEND_BASE_URL,
  BACKEND_BASE_URL,
  JWT_SECRET,
  DATABASE_HOST,
  DATABASE_NAME,
  DATABASE_USER,
  DATABASE_PASSWORD,
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USER,
  MAIL_PASS,
  STORAGE_BUCKET,
  FIREBASE_ADMINSDK_LOCATION,
  GEOCODING_API_KEY,
  MAPS_JAVASCRIPT_API_KEY,
  ADMIN_MAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  TZ,
  NODE_ENV,
} = process.env;

const production = NODE_ENV === 'production';

const config = {
  production,
  port: PORT,
  frontendBaseUrl: FRONTEND_BASE_URL,
  backendBaseUrl: BACKEND_BASE_URL,
  jwt: {
    secret: JWT_SECRET,
    authenticationTokenExpirationTime: '1h',
    refreshTokenExpirationTime: '7d',
    activationTokenExpirationTime: '15min',
    resetPasswordTokenExpirationTime: '30min',
  },
  database: {
    host: DATABASE_HOST,
    database: DATABASE_NAME,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    timezone: TZ,
    logging: !production
      ? (log) => {
          console.log(log);
        }
      : false,
  },
  mail: {
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE === 'true',
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  },
  storageBucket: STORAGE_BUCKET,
  firebaseAdminSdkLocation: FIREBASE_ADMINSDK_LOCATION,
  googleGeocodingApi: {
    url: 'https://maps.googleapis.com/maps/api/geocode/json',
    key: GEOCODING_API_KEY,
  },
  googleMapsJavascriptApi: {
    key: MAPS_JAVASCRIPT_API_KEY,
  },
  adminMail: ADMIN_MAIL,
  vapidKeys: {
    publicKey: VAPID_PUBLIC_KEY,
    privateKey: VAPID_PRIVATE_KEY,
  },
  pagination: 10,
  maxFileSize: 1024 * 1024 * 2, // 2MB
  expiryMinutes: 10,
};

export default config;
