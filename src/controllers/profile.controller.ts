import { QueryResult } from 'pg';
import { Response } from 'express';
import logger from '../middleware/winston';
import pool from '../boot/database/db_connect';
import statusCodes from '../constants/statusCodes';
import { IRequestWithUser } from '../interfaces/requestWithUser.interface';

const editPassword = async (
  req: IRequestWithUser,
  res: Response,
): Promise<Response> => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(statusCodes.badRequest)
      .json({ message: 'Missing parameters' });
  } else {
    if (oldPassword === newPassword) {
      return res
        .status(statusCodes.badRequest)
        .json({ message: 'New password cannot be equal to old password' });
    } else {
      pool.query(
        'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
        [req.user.email, oldPassword],
        (err: Error, rows: QueryResult) => {
          if (err) {
            logger.error(err.stack);
            return res
              .status(statusCodes.queryError)
              .json({ error: 'Exception occurred while updating password' });
          } else {
            if (rows.rows[0]) {
              pool.query(
                "UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE email = $2;",
                [newPassword, req.user.email],
                (err: Error, _rows: QueryResult) => {
                  void _rows;
                  if (err) {
                    logger.error(err.stack);
                    return res.status(statusCodes.queryError).json({
                      error: 'Exception occurred while updating password',
                    });
                  } else {
                    return res
                      .status(statusCodes.success)
                      .json({ message: 'Password updated' });
                  }
                },
              );
            } else {
              return res
                .status(statusCodes.badRequest)
                .json({ message: 'Incorrect password' });
            }
          }
        },
      );
    }
  }
};

const logout = async (
  req: IRequestWithUser,
  res: Response,
): Promise<Response> => {
  if (req.session.user) {
    delete req.session.user;
  }

  return res.status(200).json({ message: 'Disconnected' });
};

export = { editPassword, logout };
