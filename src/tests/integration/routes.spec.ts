import supertest from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import startApp, { app } from '../../boot/setup';
import { Server } from 'http';
import { closePool } from '../../boot/database/db_connect';
import logger from '../../middleware/winston';
import CommentModel from '../../models/commentModel';

const request = supertest(app);

let agent: supertest.Agent;
let appServer: Server;
jest.setTimeout(30000);

beforeAll(async () => {
  appServer = startApp();
  agent = supertest.agent(app);
  jest.setTimeout(30000);
});

afterAll(async () => {
  return new Promise<void>((resolve) => {
    appServer.close(async (err: Error | null) => {
      if (err) {
        logger.error('Error closing server:', err);
      } else {
        logger.info('Server closed successfully');
      }

      try {
        await closePool();
      } catch (dbError) {
        logger.error('Error closing database pool:', dbError);
      }
      resolve();
    });
  });
});

let token: string;
let messageId: string;
let uniqueEmail: string;
let movieId: number;

describe('Auth', () => {
  beforeAll(async () => {
    uniqueEmail = `${uuidv4()}@mail.com`;

    // Sign up a test user for login tests
    await request.post('/auth/signup').send({
      username: 'testuser',
      email: uniqueEmail,
      password: 'password',
    });

    // Log in to get a token for further tests
    const response = await agent.post('/auth/login').send({
      email: uniqueEmail,
      password: 'password',
    });
    token = response.body.token;
  });

  describe('POST /auth/signup', () => {
    it('should signup a new user and return 200 status code', async () => {
      const uniqueEmail = `${uuidv4()}@mail.com`;

      const response = await agent.post('/auth/signup').send({
        username: 'newuser',
        email: uniqueEmail,
        password: 'newpassword',
      });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', uniqueEmail);
    });

    it('should return 500 status code if email is already taken', async () => {
      const reusedEmail = `${uuidv4()}@mail.com`;

      // First signup attempt
      await agent.post('/auth/signup').send({
        username: 'newuser',
        email: reusedEmail,
        password: 'newpassword',
      });

      // Second signup attempt with the same email
      const response = await agent.post('/auth/signup').send({
        username: 'newuser2',
        email: reusedEmail,
        password: 'newpassword',
      });
      expect(response.status).toBe(500);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user info if user is logged in', async () => {
      const response = await agent
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', uniqueEmail);
    });
  });

  describe('GET /auth/logout', () => {
    it('should logout user and invalidate the token', async () => {
      const response = await agent
        .get('/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);

      const responseAfterLogout = await agent
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(responseAfterLogout.status).toBe(500);
    });
  });
});

describe('Movies', () => {
  beforeAll(async () => {
    const response = await request.post('/auth/login').send({
      email: 'test@mail.com',
      password: 'password',
    });
    token = response.body.token;
  });

  describe('GET /movies', () => {
    it('should return 401 status code if no token is provided', async () => {
      const response = await request.get('/movies');
      expect(response.status).toBe(401);
    });

    it('should return movies grouped by category if no category query parameter is provided', async () => {
      const response = await request
        .get('/movies')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movies');
      expect(response.body.movies).toBeInstanceOf(Object);
      expect(response.body.movies).toHaveProperty('Comedy');
      expect(response.body.movies).toHaveProperty('Top Rated');
    });

    it('should return movies by category if category query parameter is provided', async () => {
      const response = await request
        .get('/movies?category=Comedy')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movies');
      expect(response.body.movies).toBeInstanceOf(Array);
    });

    it('should return empty list if category is not found', async () => {
      const response = await request
        .get('/movies?category=NonExistent')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movies');
      expect(response.body.movies).toBeInstanceOf(Array);
      expect(response.body.movies).toHaveLength(0);
    });
  });

  describe('GET /movies/top-rated', () => {
    it('should return 401 status code if no token is provided', async () => {
      const response = await request.get('/movies/top');
      expect(response.status).toBe(401);
    });

    it('should return top ten rated movies', async () => {
      const response = await request
        .get('/movies/top')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movies');
      expect(response.body.movies).toBeInstanceOf(Array);
      expect(response.body.movies).toHaveLength(10);
    });

    it('should update the top rated movies list if a new rating is added', async () => {
      const response = await request
        .get('/movies/top')
        .set('Authorization', `Bearer ${token}`);
      const topMovie = response.body.movies[0];
      const ratingResponse = await request
        .post(`/ratings/${topMovie.movie_id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 1 });
      expect(ratingResponse.status).toBe(200);
      const updatedResponse = await request
        .get('/movies/top')
        .set('Authorization', `Bearer ${token}`);
      expect(updatedResponse.status).toBe(200);
      expect(updatedResponse.body.movies).toHaveLength(10);
      expect(updatedResponse.body.movies[0].rating).toBeGreaterThanOrEqual(
        topMovie.rating,
      );
      if (updatedResponse.body.movies[0].movie_id === topMovie.movie_id) {
        expect(updatedResponse.body.movies[0].rating).not.toEqual(
          topMovie.rating,
        );
      }
    });

    it('should not update the top rated movies list if an invalid rating is submitted', async () => {
      const response = await request
        .get('/movies/top')
        .set('Authorization', `Bearer ${token}`);
      const lastMovie = response.body.movies[response.body.movies.length - 1];
      const ratingResponse = await request
        .post(`/ratings/${lastMovie.movie_id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 6 });
      expect(ratingResponse.status).toBe(500);
      const updatedResponse = await request
        .get('/movies/top')
        .set('Authorization', `Bearer ${token}`);
      expect(updatedResponse.status).toBe(200);
      expect(updatedResponse.body.movies).toHaveLength(10);
      expect(updatedResponse.body.movies).toContainEqual(lastMovie);
    });
  });

  describe('GET /movies/me', () => {
    it('should return 401 status code if no token is provided', async () => {
      const response = await request.get('/movies/me');
      expect(response.status).toBe(401);
    });

    it('should return movies seen by the user', async () => {
      const response = await request
        .get('/movies/me')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movies');
      expect(response.body.movies).toBeInstanceOf(Array);
    });

    it('should return empty list if user has not seen any movies', async () => {
      const response = await request
        .get('/movies/me')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movies');
      expect(response.body.movies).toBeInstanceOf(Array);
      expect(response.body.movies).toHaveLength(0);
    });
  });
});

describe('Health Check', () => {
  it('should return 200 status code for health check', async () => {
    const response = await request.get('/api/health');
    expect(response.status).toBe(200);
  });
});

describe('Comments', () => {
  beforeAll(async () => {
    movieId = 1; // Example movie ID
  });

  afterEach(async () => {
    // Clean up the database after each test
    await CommentModel.deleteMany({});
  });

  describe('POST /comments/:movie_id', () => {
    it('should add a comment and return 200 status code', async () => {
      const response = await agent
        .post(`/comments/${movieId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 4,
          username: 'testuser',
          comment: 'This is a test comment.',
          title: 'Test Title',
        });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Comment added');

      const comments = await CommentModel.find({ movie_id: movieId });
      expect(comments.length).toBe(1);
      expect(comments[0]).toHaveProperty('username', 'testuser');
      expect(comments[0]).toHaveProperty('comment', 'This is a test comment.');
    });

    it('should return 400 status code for missing parameters', async () => {
      const response = await agent
        .post(`/comments/${movieId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'testuser',
          comment: 'This is a test comment.',
        });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Missing parameters');
    });
  });

  describe('GET /comments/:movie_id', () => {
    it('should return comments for a specific movie ID', async () => {
      await agent
        .post(`/comments/${movieId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 4,
          username: 'testuser',
          comment: 'This is a test comment.',
          title: 'Test Title',
        });

      const response = await agent
        .get(`/comments/${movieId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comments');
      expect(response.body.comments.length).toBe(1);
      expect(response.body.comments[0]).toHaveProperty('username', 'testuser');
    });

    it('should return 400 status code for invalid movie ID', async () => {
      const response = await agent
        .get('/comments/invalid_id')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'movie id missing');
    });
  });
});

describe('Messages', () => {
  beforeAll(async () => {
    const response = await request.post('/auth/login').send({
      email: 'test@mail.com',
      password: 'password',
    });
    token = response.body.token;
  });

  describe('POST /messages/add/message', () => {
    it('should return 401 status code if no token is provided', async () => {
      const response = await request.get('/movies');
      expect(response.status).toBe(401);
    });
    it('should add a new message', async () => {
      const response = await request
        .post('/messages/add/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: { name: 'this is a test msg`' } });

      messageId = response.body._id;

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('GET /messages', () => {
    it('should return 401 status code if no token is provided', async () => {
      const response = await request.get('/movies');
      expect(response.status).toBe(401);
    });
    it('should return all messages', async () => {
      const response = await request
        .get('/messages')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('GET /messages/:messageId', () => {
    it('should return 401 status code if no token is provided', async () => {
      const response = await request.get('/messages/1');
      expect(response.status).toBe(401);
    });

    it('should return message with specified id', async () => {
      const response = await request
        .get(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      // expect(response.body.movies).toBeInstanceOf(Object);
    });
  });

  describe('PUT /messages/edit/:messageId', () => {
    it('should return 401 status code if no token is provided', async () => {
      const response = await request.get('/movies');
      expect(response.status).toBe(401);
    });
    it('should update message with specified id', async () => {
      const response = await request
        .put(`/messages/edit/${messageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'new awesome name' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('user');
      expect(response.body.name).toBe('new awesome name');
    });
  });

  describe('DELETE /messages/delete/:messageId', () => {
    it('should return 401 status code if no token is provided', async () => {
      const response = await request.get('/movies');
      expect(response.status).toBe(401);
    });
    it('should delete message with specified id', async () => {
      const response = await request
        .delete(`/messages/delete/${messageId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Message deleted');
    });
  });
});
