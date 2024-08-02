import supertest from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import startApp, { app } from '../../boot/setup';
import { Server } from 'http';
import { closePool } from '../../boot/database/db_connect';
import logger from '../../middleware/winston';
const request = supertest(app);

let agent: supertest.Agent;
let appServer: Server;

beforeAll(async () => {
  appServer = startApp();
  agent = supertest.agent(app);
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
let uniqueEmail: string;

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

describe('heathCheck', () => {
  it('should return 200 status code', async () => {
    const response = await request.get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('All up and running !!');
  });
});

describe('User and Profile', () => {
  let token: string;
  describe('POST /users/register', () => {
    const uniqueEmail = `${uuidv4()}@mail.com`;
    it('should create a new user in the database', async () => {
      const registerResponse = await request.post('/users/register').send({
        email: uniqueEmail,
        password: 'password',
        username: 'testuser',
        country: 'France',
        city: 'Paris',
        street: 'Champs Elysees',
      });
      expect(registerResponse.status).toBe(200);
      expect(registerResponse.body).toHaveProperty('message');
      expect(registerResponse.body.message).toBe('User created');
      const loginResponse = await request.post('/users/login').send({
        email: uniqueEmail,
        password: 'password',
      });
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('username');
      expect(loginResponse.body.username).toBe('testuser');
      token = loginResponse.body.token;
    });
    it('should allow users to change their password', async () => {
      const changePasswordResponse = await request
        .put('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: 'password',
          newPassword: 'newpassword',
        });
      expect(changePasswordResponse.status).toBe(200);
      expect(changePasswordResponse.body).toHaveProperty('message');
      expect(changePasswordResponse.body.message).toBe('Password updated');
    });
    it('should return 404 status code for invalid routes', async () => {
      const invalidRouteResponse = await request.get('/invalid-route');
      expect(invalidRouteResponse.status).toBe(404);
      expect(invalidRouteResponse.body).toHaveProperty('error');
      expect(invalidRouteResponse.body.error.message).toBe('Not Found');
    });
    it('should not allow unauthorized users to change their password', async () => {
      const changePasswordResponse = await request.put('/profile').send({
        oldPassword: 'newpassword',
        newPassword: 'password',
      });
      expect(changePasswordResponse.status).toBe(401);
    });
    it('should not allow users with invalid tokens to change their password', async () => {
      const changePasswordResponse = await request
        .put('/profile')
        .set('Authorization', `Bearer invalidtoken`)
        .send({
          oldPassword: 'newpassword',
          newPassword: 'password',
        });
      expect(changePasswordResponse.status).toBe(401);
      expect(changePasswordResponse.body).toHaveProperty('error');
      expect(changePasswordResponse.body.error).toBe('Invalid token');
    });
  });
});
