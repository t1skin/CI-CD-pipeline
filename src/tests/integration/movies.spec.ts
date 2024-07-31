import supertest from 'supertest';
import startApp from '../../boot/setup';

startApp();
const request = supertest('http://localhost:8080');
let token: string;
beforeAll(async () => {
  const response = await request.post('/auth/login').send({
    email: 'test@mail.com',
    password: 'password',
  });
  token = response.body.token;
});
describe('Movies', () => {
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
