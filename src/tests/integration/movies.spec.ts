import supertest from 'supertest';
import startApp from '../../boot/setup';
try {
  startApp();
} catch (error) {
  console.log('App already started');
}
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
