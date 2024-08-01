import { Response } from 'express';
import statusCodes from '../constants/statusCodes';
import logger from '../middleware/winston';
import pool from '../boot/database/db_connect';
import jwt from 'jsonwebtoken';
import { CustomRequest } from '../interfaces/requestWithSession.interface';

const register = async (req: CustomRequest, res: Response): Promise<void> => {
  const { email, username, password } = req.body;
  const { country, city, street } = req.body;

  if (!email || !username || !password || !country) {
    res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
    return;
  }

  const client = await pool.connect();

  try {
    const result = await client.query('SELECT * FROM users WHERE email = $1;', [
      email,
    ]);
    if (result.rowCount) {
      res
        .status(statusCodes.userAlreadyExists)
        .json({ message: 'User already has an account' });
      return;
    }

    await client.query('BEGIN');
    const addedUser = await client.query(
      `INSERT INTO users(email, username, password, creation_date)
       VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
      [email, username, password, req.body.creation_date],
    );

    logger.info('USER ADDED', addedUser.rowCount);

    const address = await client.query(
      `INSERT INTO addresses(email, country, street, city) VALUES ($1, $2, $3, $4);`,
      [email, country, street, city],
    );
    logger.info('ADDRESS ADDED', address.rowCount);

    res.status(statusCodes.success).json({ message: 'User created' });
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(error.stack);
    res.status(statusCodes.queryError).json({
      message: 'Exception occurred while registering',
    });
  } finally {
    client.release();
  }
};

const login = async (req: CustomRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
    return;
  }

  pool.query(
    'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
    [email, password],
    (err, result) => {
      if (err) {
        logger.error(err.stack);
        res
          .status(statusCodes.queryError)
          .json({ error: 'Exception occurred while logging in' });
        return;
      }

      if (result.rows[0]) {
        req.session.user = {
          email: result.rows[0].email,
        };

        const token = jwt.sign(
          { user: { email: result.rows[0].email } },
          process.env.JWT_SECRET_KEY as string,
          {
            expiresIn: '1h',
          },
        );
        res
          .status(statusCodes.success)
          .json({ token, username: result.rows[0].username });
      } else {
        res
          .status(statusCodes.notFound)
          .json({ message: 'Incorrect email/password' });
      }
    },
  );
};

export { register, login };
