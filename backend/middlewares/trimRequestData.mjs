import { trimStringProperties } from '../utils/index.mjs';

function trimRequestData(req, res, next) {
  trimStringProperties(req.query);
  trimStringProperties(req.body);

  next();
}

export default trimRequestData;
