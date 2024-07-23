import pool from '../boot/database/db_connect';
import logger from '../middleware/winston';
import statusCodes from '../constants/statusCodes';
import { IMovie } from 'src/interfaces/movie.interface';
import { IRequestWithUser } from 'src/interfaces/requestWithUser.interface';
import { Request, Response } from 'express';

const getMovies = async (req: Request, res: Response): Promise<Response> => {
  const category: string = req.query.category as string;

  if (category) {
    const result: Array<IMovie> = await getMoviesByCategory(category);
    return res.status(statusCodes.success).json({ movies: result });
  } else {
    try {
      const movies: { rows: IMovie[] } = await pool.query(
        'SELECT * FROM movies GROUP BY type, movie_id;',
      );

      interface MovieAccumulator {
        [key: string]: IMovie[];
      }

      const groupedMovies = movies.rows.reduce(
        (acc: MovieAccumulator, movie: IMovie) => {
          const { type } = movie;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(movie);
          return acc;
        },
        {} as MovieAccumulator,
      );

      return res.status(statusCodes.success).json({ movies: groupedMovies });
    } catch (error) {
      logger.error(error.stack);
      res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occured while fetching movies' });
    }
  }
};

const getMoviesByCategory = async (category: string): Promise<IMovie[]> => {
  try {
    const movies = await pool.query(
      'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
      [category],
    );
    return movies.rows;
  } catch (error) {
    logger.error(error.stack);
  }
};

const getTopRatedMovies = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const movies = await pool.query(
      'SELECT * FROM movies ORDER BY rating DESC LIMIT 10;',
    );
    res.status(statusCodes.success).json({ movies: movies.rows });
  } catch (error) {
    logger.error(error.stack);
    res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occured while fetching top rated movies' });
  }
};

const getSeenMovies = async (
  req: IRequestWithUser,
  res: Response,
): Promise<void> => {
  try {
    const movies = await pool.query(
      'SELECT * FROM seen_movies S JOIN movies M ON S.movie_id = M.movie_id WHERE email = $1;',
      [req.user.email],
    );
    res.status(statusCodes.success).json({ movies: movies.rows });
  } catch (error) {
    logger.error(error.stack);
    res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occured while fetching seen movies' });
  }
};

module.exports = {
  getMovies,
  getTopRatedMovies,
  getSeenMovies,
};
