import { Response } from 'express';
import logger from '../../middleware/winston';
import pool from '../../boot/database/db_connect';
import statusCodes from '../../constants/statusCodes';
import { IRequestWithUser } from '../../interfaces/requestWithUser.interface';
import profileController from '../../controllers/profile.controller';

jest.mock('../../middleware/winston');
jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));
jest.mock('../../constants/statusCodes', () => ({
  badRequest: 400,
  success: 200,
  queryError: 500,
}));

describe('Profile Controller', () => {
  let req: Partial<IRequestWithUser>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    req = {};
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('editPassword', () => {
    it('should return 400 if parameters are missing', async () => {
      req = {
        body: {},
        user: { id: 1, email: 'test@example.com' },
      };

      await profileController.editPassword(
        req as IRequestWithUser,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should return 400 if new password is the same as old password', async () => {
      req = {
        body: { oldPassword: 'password123', newPassword: 'password123' },
        user: { id: 1, email: 'test@example.com' },
      };

      await profileController.editPassword(
        req as IRequestWithUser,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(res.json).toHaveBeenCalledWith({
        message: 'New password cannot be equal to old password',
      });
    });

    it('should return 500 if an exception occurs during the query', async () => {
      req = {
        body: { oldPassword: 'password123', newPassword: 'newpassword123' },
        user: { id: 1, email: 'test@example.com' },
      };

      const error = new Error('Test error');
      (pool.query as jest.Mock).mockImplementationOnce((_, __, callback) => {
        callback(error, null);
      });

      await profileController.editPassword(
        req as IRequestWithUser,
        res as Response,
      );

      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occurred while updating password',
      });
    });

    it('should return 400 if old password is incorrect', async () => {
      req = {
        body: { oldPassword: 'wrongpassword', newPassword: 'newpassword123' },
        user: { id: 1, email: 'test@example.com' },
      };

      (pool.query as jest.Mock).mockImplementationOnce((_, __, callback) => {
        callback(null, { rows: [] });
      });

      await profileController.editPassword(
        req as IRequestWithUser,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(res.json).toHaveBeenCalledWith({ message: 'Incorrect password' });
    });

    it('should update the password successfully', async () => {
      req = {
        body: { oldPassword: 'password123', newPassword: 'newpassword123' },
        user: { id: 1, email: 'test@example.com' },
      };

      (pool.query as jest.Mock).mockImplementationOnce((_, __, callback) => {
        callback(null, { rows: [{}] });
      });

      (pool.query as jest.Mock).mockImplementationOnce((_, __, callback) => {
        callback(null, { rows: [] });
      });

      await profileController.editPassword(
        req as IRequestWithUser,
        res as Response,
      );

      expect(res.status).toHaveBeenCalledWith(statusCodes.success);
      expect(res.json).toHaveBeenCalledWith({ message: 'Password updated' });
    });
  });

  describe('logout', () => {
    it('should delete the user session and return 200', async () => {
      req = {
        session: {
          user: { _id: 'testuser' },
          id: 'sessionid',
          cookie: {
            originalMaxAge: 1000,
            expires: new Date(),
            secure: false,
            httpOnly: true,
            path: '/',
          },
          resetMaxAge: jest.fn(),
          regenerate: jest.fn(),
          destroy: jest.fn(),
          reload: jest.fn(),
          save: jest.fn(),
          touch: jest.fn(),
        },
      };

      await profileController.logout(req as IRequestWithUser, res as Response);

      expect(req.session!.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(statusCodes.success);
      expect(res.json).toHaveBeenCalledWith({ message: 'Disconnected' });
    });

    it('should return 200 even if session is undefined', async () => {
      req = {
        session: {
          id: 'sessionid',
          cookie: {
            originalMaxAge: 1000,
            expires: new Date(),
            secure: false,
            httpOnly: true,
            path: '/',
          },
          resetMaxAge: jest.fn(),
          regenerate: jest.fn(),
          destroy: jest.fn(),
          reload: jest.fn(),
          save: jest.fn(),
          touch: jest.fn(),
        },
      };

      await profileController.logout(req as IRequestWithUser, res as Response);

      expect(res.status).toHaveBeenCalledWith(statusCodes.success);
      expect(res.json).toHaveBeenCalledWith({ message: 'Disconnected' });
    });
  });
});
