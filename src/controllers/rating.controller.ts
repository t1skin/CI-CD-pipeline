import pool from '../boot/database/db_connect';
import logger from '../middleware/winston';
import statusCodes from '../constants/statusCodes';
import ratingModel from '../models/ratingModel';
import { Response } from 'express';
import { IRequestWithUser } from '../interfaces/requestWithUser.interface';

const addRating = async (
  req: IRequestWithUser,
  res: Response,
): Promise<void> => {
  const { movieId } = req.params;
  const { rating } = req.body;

  const movie_id = parseInt(movieId);

  if (isNaN(movie_id) || !rating) {
    res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
  } else {
    try {
      const ratingObj = new ratingModel({
        email: req.user.email,
        movie_id,
        rating, // equivalent of rating: rating
      });

      await ratingObj.save();

      const ratings = await ratingModel.find({}, { rating });

      const averageRating = ratings.reduce(
        (acc, rating) => acc + rating.rating,
        0,
      );

      console.log(averageRating, typeof averageRating);
      await pool.query('UPDATE movies SET rating = $1 WHERE movie_id = $2;', [
        averageRating,
        movie_id,
      ]);
      res.status(statusCodes.success).json({ message: 'Rating added' });
    } catch (error) {
      logger.error(error.stack);
      res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occurred while adding rating' });
    }
  }
};

export { addRating };
