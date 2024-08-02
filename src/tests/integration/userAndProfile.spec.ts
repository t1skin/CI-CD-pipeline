import startApp from '../../boot/setup';
import supertest from 'supertest';
import { v4 as uuidv4 } from 'uuid';

const request = supertest('http://localhost:8080');
beforeAll(async () => {
  try {
    await request.get('/api/health');
  } catch (error) {
    startApp();
  }
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
