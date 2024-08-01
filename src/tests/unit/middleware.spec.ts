import { NextFunction, Request, Response } from 'express';
import notFound from '../../middleware/notFound';
import logger, { LoggerStream } from '../../middleware/winston';
import statusCodes from '../../constants/statusCodes';
import validator from '../../middleware/validator';

describe('Middleware', () => {
  describe('notFound', () => {
    it('should return 404 status code', () => {
      const req: Partial<Request> = {};
      const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      notFound(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Not Found',
        },
      });
    });
  });

  describe('winston logger', () => {
    it('should log error message', () => {
      const error = new Error('Database error');
      const errorSpy = jest.spyOn(logger, 'error');
      logger.error(error.stack);

      expect(errorSpy).toHaveBeenCalledWith(error.stack);
    });

    it('should log info message', () => {
      const infoSpy = jest.spyOn(logger, 'info');
      logger.info('Info message');

      expect(infoSpy).toHaveBeenCalledWith('Info message');
    });

    describe('LoggerStream', () => {
      let loggerStream: LoggerStream;

      beforeEach(() => {
        loggerStream = new LoggerStream();
        jest.spyOn(logger, 'info').mockImplementation(() => logger);
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should remove extra newlines from the message', () => {
        const message = 'Test log message\n';
        loggerStream.write(message);

        expect(logger.info).toHaveBeenCalledWith('Test log message');
      });
    });
  });

  describe('Validator', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
      req = {
        body: {},
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should delete creation_date if it exists in the request body', () => {
      req.body = { creation_date: '2023-01-01', someKey: 'someValue' };

      validator(req as Request, res as Response, next);

      expect(req.body.creation_date).toBe(new Date().toJSON().slice(0, 10));
      expect(next).toHaveBeenCalled();
    });

    it('should add current date as creation_date in the request body', () => {
      req.body = { someKey: 'someValue' };

      validator(req as Request, res as Response, next);

      expect(req.body.creation_date).toBe(new Date().toJSON().slice(0, 10));
      expect(next).toHaveBeenCalled();
    });

    it('should set empty string values to null', () => {
      req.body = { someKey: '', anotherKey: 'value' };

      validator(req as Request, res as Response, next);

      expect(req.body.someKey).toBeNull();
      expect(req.body.anotherKey).toBe('value');
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors and respond with a 400 status code', () => {
      req.body = null; // This will throw an error in the for loop

      validator(req as Request, res as Response, next);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad request' });
    });
  });
});
