import { expect } from 'chai';
import { Error as MongooseError } from 'mongoose';
import CommentModel from '../../models/commentModel';
import { IComment } from '../../interfaces/comment.interface';

describe('Comment Model', () => {
  let sampleCommentVal: IComment;

  beforeEach(() => {
    sampleCommentVal = {
      movie_id: 1,
      username: 'sampleuser',
      comment: 'This is a comment',
      title: 'Sample Title',
      rating: 4,
      downvotes: 0,
      upvotes: 0,
      created_at: new Date(),
    };
  });

  describe('Comment model validation', () => {
    it('should create a new comment', async () => {
      const comment = new CommentModel(sampleCommentVal);
      await comment.validate();

      expect(comment).to.include({
        movie_id: 1,
        username: 'sampleuser',
        comment: 'This is a comment',
        title: 'Sample Title',
        rating: 4,
        downvotes: 0,
        upvotes: 0,
      });
    });

    it('should throw an error if required fields are missing', async () => {
      const comment = new CommentModel({});

      try {
        await comment.validate();
      } catch (err) {
        const error = err as MongooseError.ValidationError;
        expect(error.errors.movie_id).to.exist;
        expect(error.errors.username).to.exist;
        expect(error.errors.comment).to.exist;
        expect(error.errors.title).to.exist;
        expect(error.errors.rating).to.exist;
      }
    });

    it('should throw an error if rating is out of range', async () => {
      const comment = new CommentModel({ ...sampleCommentVal, rating: 6 });

      try {
        await comment.validate();
      } catch (err) {
        const error = err as MongooseError.ValidationError;
        expect(error.errors.rating).to.exist;
        expect(error.errors.rating.message).to.include(
          'Path `rating` (6) is more than maximum allowed value (5).',
        );
      }
    });

    it('should throw an error if rating is below range', async () => {
      const comment = new CommentModel({ ...sampleCommentVal, rating: -1 });

      try {
        await comment.validate();
      } catch (err) {
        const error = err as MongooseError.ValidationError;
        expect(error.errors.rating).to.exist;
        expect(error.errors.rating.message).to.include(
          'Path `rating` (-1) is less than minimum allowed value (0).',
        );
      }
    });

    it('should throw an error if downvotes are negative', async () => {
      const comment = new CommentModel({ ...sampleCommentVal, downvotes: -1 });

      try {
        await comment.validate();
      } catch (err) {
        const error = err as MongooseError.ValidationError;
        expect(error.errors.downvotes).to.exist;
        expect(error.errors.downvotes.message).to.include(
          'Path `downvotes` (-1) is less than minimum allowed value (0).',
        );
      }
    });

    it('should throw an error if upvotes are negative', async () => {
      const comment = new CommentModel({ ...sampleCommentVal, upvotes: -1 });

      try {
        await comment.validate();
      } catch (err) {
        const error = err as MongooseError.ValidationError;
        expect(error.errors.upvotes).to.exist;
        expect(error.errors.upvotes.message).to.include(
          'Path `upvotes` (-1) is less than minimum allowed value (0).',
        );
      }
    });

    it('should set default values for optional fields', async () => {
      const comment = new CommentModel({
        movie_id: 1,
        username: 'sampleuser',
        comment: 'This is a comment',
        title: 'Sample Title',
        rating: 4,
      });
      await comment.validate();

      expect(comment.downvotes).to.equal(0);
      expect(comment.upvotes).to.equal(0);
    });
  });
});
