import express from 'express';
const router = express.Router();

import Category from '../models/Category.mjs';

/* GET categories listing. */
router.get('/', async function (req, res, next) {
  const categories = await Category.findAll({
    attributes: ['idCategory', 'name'],
    order: [['name', 'ASC']],
  });

  return res.json(categories);
});

export default router;
