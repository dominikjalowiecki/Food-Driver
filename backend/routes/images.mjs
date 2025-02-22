import express from 'express';
const router = express.Router();

import createError from 'http-errors';
import { fileTypeFromBuffer } from 'file-type';
import { v4 as uuid } from 'uuid';
import Image from '../models/Image.mjs';
import authenticate from '../middlewares/authenticate.mjs';
import { bucket } from '../firebase.mjs';

/* POST create image. */
router.post('/', authenticate(), async function (req, res, next) {
  const allowedMimeTypes = [
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  let image = req.files?.image;

  if (!image) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  if (Array.isArray(image)) {
    image = image[0];
  }

  const fileType = await fileTypeFromBuffer(image.data);

  if (!fileType?.mime || !allowedMimeTypes.includes(fileType.mime)) {
    return next(createError(400, 'Nieprawidłowa treść żądania'));
  }

  const name = `${uuid()}/${encodeURIComponent(image.name)}`;

  const bucketFile = bucket.file(name);
  await bucketFile.save(image.data, {
    gzip: true,
    contentType: fileType.mime,
    resumable: false,
    public: true,
  });
  const url = bucketFile.publicUrl().replace(/%2F/g, '/');

  const createdImage = await Image.create({
    url,
  });

  return res.status(201).json({
    idImage: createdImage.idImage,
  });
});

export default router;
