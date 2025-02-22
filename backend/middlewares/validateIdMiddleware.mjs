import createError from 'http-errors';
import { validateId } from '../utils/index.mjs';

function validateIdMiddleware(idName) {
  return (req, res, next) => {
    let id = req.params[idName];
    id = Number(id);

    if (!validateId(id)) {
      return next(createError(400, 'Nieprawidłowy identyfikator'));
    }

    next();
  };
}

export default validateIdMiddleware;
