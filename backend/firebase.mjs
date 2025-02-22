import admin from 'firebase-admin';
import config from './config.mjs';
import fs from 'node:fs';

const { firebaseAdminSdkLocation, storageBucket } = config;

const serviceAccount = JSON.parse(
  fs.readFileSync(firebaseAdminSdkLocation, 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket,
});

export const bucket = admin.storage().bucket();
