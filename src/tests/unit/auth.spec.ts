import { Request, Response } from 'express';
import userModel from '../../models/userModel';
import { 
  getUser, 
  logout, 
  signin, 
  signup 
} from '../../controllers/auth.controller';
import bcrypt from 'bcrypt';
import { CustomRequest } from '../../interfaces/requestWithSession.interface';
import jwt from 'jsonwebtoken';
import { Query } from 'mongoose';

jest.mock('../../models/userModel');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('token'),
}));

describe('Auth Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('signup', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let passwordHash: string;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = {
        body: {
          username: 'test',
          email: 'test@mail.com',
          password: 'password',
        },
      };
      passwordHash = bcrypt.hashSync('password', 10);
      statusMock = jest.fn().mockReturnThis();
      jsonMock = jest.fn();
      res = {
        status: statusMock,
        json: jsonMock,
      };
    });
    it('should return 400 if missing information', async () => {
      req = {
        body: {},
      };
      await signup(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'missing information' });
    });
    it('should return 200 if user is saved', async () => {
      jest.spyOn(userModel.prototype, 'save').mockResolvedValue({
        username: 'test',
        email: 'test@mail.com',
        password: passwordHash,
      });
      await signup(req as Request, res as Response);

      expect(userModel).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        username: 'test',
        email: 'test@mail.com',
        password: passwordHash,
      });
    });
    it('should return 500 if user is not saved', async () => {
      jest
        .spyOn(userModel.prototype, 'save')
        .mockRejectedValue('failed to save user');
      await signup(req as Request, res as Response);

      expect(userModel).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'failed to save user' });
    });
  });

  describe('signin', () => {
    let req: Partial<CustomRequest> = {
      body: {
        email: 'test@example.com',
        password: 'password',
      },
    };
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      statusMock = jest.fn().mockReturnThis();
      jsonMock = jest.fn();
      res = {
        status: statusMock,
        json: jsonMock,
      };
    });
    it('should return 400 if missing information', async () => {
      req = {
        body: {},
      };
      await signin(req as CustomRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'missing information' });
    });
    it('should return 400 if user is not found', async () => {
      req.body = {
        email: 'noUser@mail.com',
        password: 'password',
      };
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
      await signin(req as CustomRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
    it('should return 400 if password is incorrect', async () => {
      req.body = {
        email: 'test@mail.com',
        password: 'wrongpassword',
      };
      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        email: 'test@mail.com',
        password: bcrypt.hashSync('password', 10),
        username: 'test',
      });
      await signin(req as CustomRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email or password don't match",
      });
    });
    it('should return 200 if user is found', async () => {
      req = {
        body: {
          email: 'test@mail.com',
          password: 'password',
        },
        session: {
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
        },
      };
      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        _id: '1',
        email: 'test@mail.com',
        password: bcrypt.hashSync('password', 10),
        username: 'test',
      });
      const sign = jest.spyOn(jwt, 'sign') as jest.Mock;
      sign.mockReturnValue('token');
      await signin(req as CustomRequest, res as Response);
      expect(userModel.findOne).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: 'token' });
    });
    it('should return 500 if db throws an error', async () => {
      req.body = {
        email: 'test@mail.com',
        password: 'password',
      };
      jest.spyOn(userModel, 'findOne').mockRejectedValue('Failed to get user');
      await signin(req as CustomRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get user' });
    });
  });
  describe('getUser', () => {
    let req: Partial<CustomRequest>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = {
        session: {
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
            _id: '1',
          },
        },
      };
      statusMock = jest.fn().mockReturnThis();
      jsonMock = jest.fn();
      res = {
        status: statusMock,
        json: jsonMock,
      };
    });

    it('should return 500 if session.user is not set', async () => {
      req.session.user = undefined;
      await getUser(req as CustomRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You are not authenticated',
      });
    });

    it('should return 400 if user is not found', async () => {
      req.session.user = { _id: '1' };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as unknown as Query<any, any, any>);
      await getUser(req as CustomRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 200 if user is found', async () => {
      req.session.user = { _id: '1' };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: '1',
          email: 'test@mail.com',
          username: 'test',
        }),
      } as unknown as Query<any, any, any>);
      await getUser(req as CustomRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        _id: '1',
        email: 'test@mail.com',
        username: 'test',
      });
    });

    it('should return 500 if db throws an error', async () => {
      req.session.user = { _id: '1' };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Failed to get user')),
      } as unknown as Query<any, any, any>);
      await getUser(req as CustomRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get user' });
    });
  });

  describe('logout', () => {
    let req: Partial<CustomRequest>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = {
        session: {
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
        },
      };
      statusMock = jest.fn().mockReturnThis();
      jsonMock = jest.fn();
      res = {
        status: statusMock,
        json: jsonMock,
      };
    });
    it('should return 200 if user is logged out', () => {
      req.session.user = { _id: '1' };
      logout(req as CustomRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Disconnected' });
    });
  });
});
