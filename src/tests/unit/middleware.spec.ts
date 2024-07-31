import { Request, Response } from 'express';
import notFound from '../../middleware/notFound';
import logger, { LoggerStream } from '../../middleware/winston';

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
});
