import { Response } from 'express';
import ratingModel from '../../models/ratingModel';
import { addRating } from '../../controllers/rating.controller';
import { IRequestWithUser } from '../../interfaces/requestWithUser.interface';
import pool from '../../boot/database/db_connect';
//
jest.mock('../../models/ratingModel');
jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
  end: jest.fn(),
}));
afterAll(async () => {
  jest.clearAllMocks();
  await pool.end();
});

describe('Rating Controller', () => {
  describe('addRating', () => {
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
    it('should add a rating', async () => {
      req = {
        body: { rating: 4 },
        params: { movieId: '1' },
        user: { id: 1, email: 'test@mail.com' },
      };
      await addRating(req as IRequestWithUser, res as Response);
      expect(ratingModel).toHaveBeenCalledTimes(1);
      expect(ratingModel).toHaveBeenCalledWith({
        email: 'test@mail.com',
        movie_id: 1,
        rating: 4,
      });
    });
    it('should return a 400 error if a paramater is missing', async () => {
      req = {
        body: {},
        params: { movieId: '1' },
        user: { id: 1, email: 'test@mail.com' },
      };
      await addRating(req as IRequestWithUser, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });
    it('should update the movie rating', async () => {
      req = {
        body: { rating: 4 },
        params: { movieId: '1' },
        user: { id: 1, email: 'test@mail.com' },
      };
      jest.spyOn(ratingModel, 'find').mockResolvedValue([{ rating: 4 }]);
      await addRating(req as IRequestWithUser, res as Response);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE movies SET rating = $1 WHERE movie_id = $2;',
        [4, 1],
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Rating added' });
    });
    it('should return a 500 error if an exception occurs', async () => {
      req = {
        body: { rating: 4 },
        params: { movieId: '1' },
        user: { id: 1, email: 'test@mail.com' },
      };
      jest.spyOn(ratingModel, 'find').mockRejectedValue(new Error('error'));
      await addRating(req as IRequestWithUser, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occurred while adding rating',
      });
    });
  });
});
