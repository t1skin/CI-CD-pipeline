import { Request, Response } from 'express';
import CommentModel from '../../models/commentModel';
import logger from '../../middleware/winston';
import statusCodes from '../../constants/statusCodes';
import {
  addComment,
  getCommentsById,
} from '../../controllers/comments.controller';

jest.mock('../../middleware/winston');
jest.mock('../../constants/statusCodes', () => ({
  badRequest: 400,
  success: 200,
  queryError: 500,
}));

describe('Comment Controller', () => {
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

  describe('addComment', () => {
    it('should return 400 if parameters are missing', async () => {
      req = {
        body: {},
        params: { movie_id: '1' },
      };

      await addComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should add a comment successfully', async () => {
      req = {
        body: {
          rating: 4,
          username: 'testuser',
          comment: 'This is a test comment',
          title: 'Test Title',
        },
        params: { movie_id: '1' },
      };

      const saveMock = jest.fn().mockResolvedValue({});
      jest.spyOn(CommentModel.prototype, 'save').mockImplementation(saveMock);

      await addComment(req as Request, res as Response);

      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(statusCodes.success);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment added' });
    });

    it('should return 500 if an exception occurs', async () => {
      req = {
        body: {
          rating: 4,
          username: 'testuser',
          comment: 'This is a test comment',
          title: 'Test Title',
        },
        params: { movie_id: '1' },
      };

      const error = new Error('Test error');
      const saveMock = jest.fn().mockRejectedValue(error);
      jest.spyOn(CommentModel.prototype, 'save').mockImplementation(saveMock);

      await addComment(req as Request, res as Response);

      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occurred while adding comment',
      });
    });
  });

  describe('getCommentsById', () => {
    it('should return 400 if movie_id is missing', async () => {
      req = {
        params: { movie_id: '' },
      };

      await getCommentsById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(res.json).toHaveBeenCalledWith({ message: 'movie id missing' });
    });

    it('should return comments successfully', async () => {
      req = {
        params: { movie_id: '1' },
      };

      const comments = [
        {
          movie_id: 1,
          username: 'testuser',
          comment: 'This is a test comment',
          title: 'Test Title',
          rating: 4,
          downvotes: 0,
          upvotes: 0,
          created_at: new Date(),
        },
      ];
      jest.spyOn(CommentModel, 'find').mockResolvedValue(comments);

      await getCommentsById(req as Request, res as Response);

      expect(CommentModel.find).toHaveBeenCalledWith({ movie_id: 1 });
      expect(res.status).toHaveBeenCalledWith(statusCodes.success);
      expect(res.json).toHaveBeenCalledWith({ comments });
    });

    it('should return 500 if an exception occurs', async () => {
      req = {
        params: { movie_id: '1' },
      };

      const error = new Error('Test error');
      jest.spyOn(CommentModel, 'find').mockRejectedValue(error);

      await getCommentsById(req as Request, res as Response);

      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occured while fetching comments',
      });
    });
  });
});
