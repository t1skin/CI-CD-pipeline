import { Request, Response } from 'express';
import {
  getMovies,
  getSeenMovies,
  getTopRatedMovies,
} from '../../controllers/movies.controller';
import pool from '../../boot/database/db_connect';
import logger from '../../middleware/winston';
import statusCodes from '../../constants/statusCodes';
import { IMovie } from '../../interfaces/movie.interface';
import { IRequestWithUser } from '../../interfaces/requestWithUser.interface';

jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
  end: jest.fn(),
}));
jest.mock('../../middleware/winston');

afterAll(async () => {
  jest.clearAllMocks();
  await pool.end();
});

describe('Movies Controller', () => {
  describe('getMovies', () => {
    let req: Partial<Request>;
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

    it('should return movies by category if category query parameter is provided', async () => {
      req.query = { category: 'Action' };
      const mockMovies: IMovie[] = [
        {
          movie_id: 1,
          title: 'Movie 1',
          type: 'Action',
          release_date: new Date(),
          rating: 5,
          author: 'John Doe',
          poster: 'poster.jpg',
          backdrop_poster: 'backdrop.jpg',
          overview: 'Movie overview',
        },
      ];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockMovies });

      await getMovies(req as Request, res as Response);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
        ['Action'],
      );
      expect(statusMock).toHaveBeenCalledWith(statusCodes.success);
      expect(jsonMock).toHaveBeenCalledWith({ movies: mockMovies });
    });

    it('should return grouped movies if category query parameter is not provided', async () => {
      req.query = {};
      const mockMovies: IMovie[] = [
        {
          movie_id: 1,
          title: 'Movie 1',
          type: 'Action',
          release_date: new Date(),
          rating: 5,
          author: 'John Doe',
          poster: 'poster.jpg',
          backdrop_poster: 'backdrop.jpg',
          overview: 'Movie overview',
        },
        {
          movie_id: 2,
          title: 'Movie 2',
          type: 'Drama',
          release_date: new Date(),
          rating: 4,
          author: 'John Doe',
          poster: 'poster.jpg',
          backdrop_poster: 'backdrop.jpg',
          overview: 'Movie overview',
        },
      ];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockMovies });

      await getMovies(req as Request, res as Response);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM movies GROUP BY type, movie_id;',
      );
      expect(statusMock).toHaveBeenCalledWith(statusCodes.success);
      expect(jsonMock).toHaveBeenCalledWith({
        movies: {
          Action: [mockMovies[0]],
          Drama: [mockMovies[1]],
        },
      });
    });

    it('should handle errors when fetching movies without category', async () => {
      req.query = {};
      const error = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValue(error);

      await getMovies(req as Request, res as Response);

      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(statusMock).toHaveBeenCalledWith(statusCodes.queryError);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Exception occured while fetching movies',
      });
    });

    it('should handle errors when fetching movies by category', async () => {
      req.query = { category: 'Action' };
      const error = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValue(error);

      await getMovies(req as Request, res as Response);

      expect(logger.error).toHaveBeenCalledWith(error.stack);
    });
  });

  describe('getTopRatedMovies', () => {
    let req: Partial<Request>;
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

    it('should return top rated movies', async () => {
      const mockMovies: IMovie[] = [
        {
          movie_id: 1,
          title: 'Movie 1',
          type: 'Action',
          release_date: new Date(),
          rating: 5,
          author: 'John Doe',
          poster: 'poster.jpg',
          backdrop_poster: 'backdrop.jpg',
          overview: 'Movie overview',
        },
      ];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockMovies });

      await getTopRatedMovies(req as Request, res as Response);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM movies ORDER BY rating DESC LIMIT 10;',
      );
      expect(statusMock).toHaveBeenCalledWith(statusCodes.success);
      expect(jsonMock).toHaveBeenCalledWith({ movies: mockMovies });
    });

    it('should handle errors when fetching top rated movies', async () => {
      const error = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValue(error);

      await getTopRatedMovies(req as Request, res as Response);

      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(statusMock).toHaveBeenCalledWith(statusCodes.queryError);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Exception occured while fetching top rated movies',
      });
    });
  });

  describe('getSeenMovies', () => {
    let req: Partial<IRequestWithUser>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = { user: { id: 1, email: 'test@mail.com' } };
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

    it('should return seen movies', async () => {
      const mockMovies: IMovie[] = [
        {
          movie_id: 1,
          title: 'Movie 1',
          type: 'Action',
          release_date: new Date(),
          rating: 5,
          author: 'John Doe',
          poster: 'poster.jpg',
          backdrop_poster: 'backdrop.jpg',
          overview: 'Movie overview',
        },
      ];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockMovies });

      await getSeenMovies(req as IRequestWithUser, res as Response);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM seen_movies S JOIN movies M ON S.movie_id = M.movie_id WHERE email = $1;',
        ['test@mail.com'],
      );
      expect(statusMock).toHaveBeenCalledWith(statusCodes.success);
      expect(jsonMock).toHaveBeenCalledWith({ movies: mockMovies });
    });

    it('should handle errors when fetching seen movies', async () => {
      const error = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValue(error);

      await getSeenMovies(req as IRequestWithUser, res as Response);

      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(statusMock).toHaveBeenCalledWith(statusCodes.queryError);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Exception occured while fetching seen movies',
      });
    });
  });
});
