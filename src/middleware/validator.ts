import { Request, Response, NextFunction } from 'express';
import logger from './winston';
import statusCodes from '../constants/statusCodes';
const { badRequest } = statusCodes;

const validator = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  // No creation date is allowed to pass through
  req.body.creation_date && delete req.body.creation_date;

  const creationDate = new Date().toJSON().slice(0, 10);
  req.body.creation_date = creationDate;

  try {
    for (const [key, originalValue] of Object.entries(req.body)) {
      let value = originalValue;
      if (value === '') {
        value = null;
        req.body[key] = value;
        continue;
      }
    }

    next();
  } catch (error) {
    logger.error(error);
    res.status(badRequest).json({ error: 'Bad request' });
  }
};

export default validator;
