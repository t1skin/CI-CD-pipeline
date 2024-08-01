import { Response } from 'express';
import { CustomRequest } from '../../interfaces/requestWithSession.interface';
import pool from '../../boot/database/db_connect';
import statusCodes from '../../constants/statusCodes';
import { login, register } from '../..//controllers/users.controller';
import { PoolClient } from 'pg';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-token'),
}));

jest.mock('../../middleware/winston');

jest.mock('../../boot/database/db_connect', () => ({
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
}));

describe('Users Controller', () => {
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    } as unknown as jest.Mocked<PoolClient>;

    (pool.connect as jest.Mock).mockReset();
    (pool.query as jest.Mock).mockReset();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('register', () => {
    let req: Partial<CustomRequest>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = {
        body: {
          email: 'test@mail.com',
          username: 'test',
          password: 'password',
          country: 'France',
          city: 'Paris',
          street: 'Champs Elysees',
        },
      };
      res = {
        status: (statusMock = jest.fn().mockReturnThis()),
        json: (jsonMock = jest.fn()),
      };

      (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    });

    it('should return missing parameters if required fields are missing', async () => {
      req.body = {};
      await register(req as CustomRequest, res as Response);
      expect(statusMock).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should return user already exists if user is already registered', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 } as never);
      await register(req as CustomRequest, res as Response);
      expect(statusMock).toHaveBeenCalledWith(statusCodes.userAlreadyExists);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'User already has an account',
      });
    });
    it('should return success if user is registered', async () => {
      (mockClient.query as jest.Mock).mockResolvedValue({ rowCount: 0 });
      await register(req as CustomRequest, res as Response);
      expect(statusMock).toHaveBeenCalledWith(statusCodes.success);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User created' });
    });

    it('should return query error if an error occurs', async () => {
      mockClient.query.mockRejectedValueOnce(
        new Error('Database error') as never,
      );
      await register(req as CustomRequest, res as Response);
      expect(statusMock).toHaveBeenCalledWith(statusCodes.queryError);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Exception occurred while registering',
      });
    });
  });

  describe('login', () => {
    let req: Partial<CustomRequest>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = {
        body: {
          email: 'test@mail.com',
          password: 'password',
        },
      };
      res = {
        status: (statusMock = jest.fn().mockReturnThis()),
        json: (jsonMock = jest.fn()),
      };
    });

    it('should return missing parameters if required fields are missing', async () => {
      req.body = {};
      await login(req as CustomRequest, res as Response);
      expect(statusMock).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should return query error if an error occurs', async () => {
      (pool.query as jest.Mock).mockImplementationOnce(
        (_query, _params, callback) => {
          callback(new Error('Database error'), null);
        },
      );
      await login(req as CustomRequest, res as Response);
      expect(statusMock).toHaveBeenCalledWith(statusCodes.queryError);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Exception occurred while logging in',
      });
    });

    it('should return incorrect email/password if user does not exist', async () => {
      (pool.query as jest.Mock).mockImplementationOnce(
        (_query, _params, callback) => {
          callback(null, { rows: [] });
        },
      );
      await login(req as CustomRequest, res as Response);
      expect(statusMock).toHaveBeenCalledWith(statusCodes.notFound);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Incorrect email/password',
      });
    });

    it('should return token if user exists', async () => {
      (req.session = {
        id: '',
        cookie: {
          maxAge: 0,
          originalMaxAge: 0,
        },
        regenerate: jest.fn(),
        destroy: jest.fn(),
        save: jest.fn(),
        reload: jest.fn(),
        resetMaxAge: jest.fn(),
        touch: jest.fn(),
        user: {
          _id: '',
        },
      }),
        (pool.query as jest.Mock).mockImplementationOnce(
          (_query, _params, callback) => {
            callback(null, {
              rows: [{ email: 'test@mail.com', username: 'test' }],
            });
          },
        );
      await login(req as CustomRequest, res as Response);
      expect(req.session.user).toMatchObject({ email: 'test@mail.com' });
      expect(statusMock).toHaveBeenCalledWith(statusCodes.success);
      expect(jsonMock).toHaveBeenCalledWith({
        token: 'mocked-token',
        username: 'test',
      });
    });
  });
});
