import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import config from '../config.mjs';
import TokenType from '../utils/tokenTypeEnum.mjs';

function authenticate(allowedRoles = null, triggerUnauthenticated = true) {
  return (req, res, next) => {
    const authenticationHeader = req.headers.authorization;
    const authenticationToken =
      authenticationHeader?.split('Bearer ')[1] ?? null;

    if (authenticationToken === null) {
      if (triggerUnauthenticated) {
        return next(createError(401, 'Nieprawidłowy token uwierzyteniający'));
      } else {
        next();
      }

      return;
    }

    let authenticationPayload;
    try {
      authenticationPayload = jwt.verify(
        authenticationToken,
        config.jwt.secret
      );
    } catch (err) {
      console.error(err);
      return next(createError(401, 'Nieprawidłowy token uwierzyteniający'));
    }

    const { user, tokenType } = authenticationPayload;

    if (tokenType !== TokenType.AUTHENTICATION) {
      return next(createError(401, 'Nieprawidłowy token uwierzyteniający'));
    }

    if (allowedRoles !== null && !allowedRoles.includes(user.role)) {
      return next(createError(403, 'Użytkownik nie może wykonać tej akcji'));
    }

    req.user = user;

    next();
  };
}

export default authenticate;
