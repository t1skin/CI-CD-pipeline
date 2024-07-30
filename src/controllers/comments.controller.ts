import logger from '../middleware/winston';
import statusCodes from '../constants/statusCodes';
import CommentModel, { ICommentDocument } from '../models/commentModel';
import { Request, Response } from 'express';

const addComment = async (req: Request, res: Response): Promise<Response> => {
  const { movie_id } = req.params;
  const { rating, username, comment, title } = req.body;

  const movieId: number = parseInt(movie_id);

  if (!movie_id || isNaN(movieId) || !rating || !username || !comment || !title) {
    return res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
  } else {
    try {
      const commentObj: ICommentDocument = new CommentModel({
        movie_id: movieId,
        rating,
        username,
        comment,
        title,
      });

      await commentObj.save();

      return res.status(statusCodes.success).json({ message: 'Comment added' });
    } catch (error) {
      logger.error(error.stack);
      return res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occurred while adding comment' });
    }
  }
};

const getCommentsById = async (req: Request, res: Response): Promise<Response> => {
  const { movie_id } = req.params;

  const movieId: number = parseInt(movie_id);

  if (!movie_id || isNaN(movieId)) {
    return res.status(statusCodes.badRequest).json({ message: 'movie id missing' });
  } else {
    try {
      const comments: ICommentDocument[] = await CommentModel.find({ movie_id: movieId });
      return res.status(statusCodes.success).json({ comments });
    } catch (error) {
      logger.error(error.stack);
      return res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occured while fetching comments' });
    }
  }
};

export {
  addComment,
  getCommentsById,
};
