import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import statusCodes from '../constants/statusCodes';
const { unauthorized } = statusCodes;
import logger from './winston';

interface CustomRequest extends Request {
  user?: any;
}

const verifyToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Response | void => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(unauthorized).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(
      token.split(' ')[1],
      process.env.JWT_SECRET_KEY as string,
    ) as any;
    req.user = decoded.user;

    console.log('TOKEN USER: ', req.user);
    next();
  } catch (error) {
    logger.error(error);
    return res.status(unauthorized).json({ error: 'Invalid token' });
  }
};

export default verifyToken;
