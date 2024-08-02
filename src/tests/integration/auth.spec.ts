import supertest from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import startApp from '../../boot/setup';

const request = supertest('http://localhost:8080');

beforeAll(async () => {
  try {
    await request.get('/health');
  } catch (error) {
    await startApp();
  }
});

let token: string;

beforeAll(async () => {
  const uniqueEmail = `${uuidv4()}@mail.com`;

  // Sign up a test user for login tests
  await request.post('/auth/signup').send({
    username: 'testuser',
    email: uniqueEmail,
    password: 'password',
  });

  // Log in to get a token for further tests
  const response = await request.post('/auth/login').send({
    email: uniqueEmail,
    password: 'password',
  });
  token = response.body.token;
});

describe('Auth', () => {
  describe('POST /auth/signup', () => {
    it('should signup a new user and return 200 status code', async () => {
      const uniqueEmail = `${uuidv4()}@mail.com`;

      const response = await request.post('/auth/signup').send({
        username: 'newuser',
        email: uniqueEmail,
        password: 'newpassword',
      });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', uniqueEmail);
    });

    // it('should return 400 status code if email is already taken', async () => {
    //   const reusedEmail = `${uuidv4()}@mail.com`;

    //   // First signup attempt
    //   await request.post('/auth/signup').send({
    //     username: 'newuser',
    //     email: reusedEmail,
    //     password: 'newpassword',
    //   });

    //   // Second signup attempt with the same email
    //   const response = await request.post('/auth/signup').send({
    //     username: 'newuser2',
    //     email: reusedEmail,
    //     password: 'newpassword',
    //   });

    //   // Check for 400 status code
    //   if (response.status !== 400) {
    //     console.error('Expected 400 status, received:', response.status, 'Response:', response.body);
    //   }

    //   expect(response.status).toBe(400);
    // });
  });

  describe('GET /auth/me', () => {
    it('should return 500 status code if no token is provided', async () => {
      const response = await request.get('/auth/me');
      expect(response.status).toBe(500);
    });

    // it('should return user info if token is provided', async () => {
    //   console.log('Token being used for GET /auth/me:', token);
    //   const response = await request
    //     .get('/auth/me')
    //     .set('Authorization', `Bearer ${token}`);

    //   // Check for 200 status code
    //   if (response.status !== 200) {
    //     console.error('Expected 200 status, received:', response.status, 'Response:', response.body);
    //   }

    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('email', 'newuser@mail.com');
    // });
  });

  describe('GET /auth/logout', () => {
    it('should logout user and invalidate the token', async () => {
      const response = await request
        .get('/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);

      const responseAfterLogout = await request
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(responseAfterLogout.status).toBe(500);
    });
  });
});
