import Rating from '../../models/ratingModel';
//
describe('Rating Model', () => {
  it('should create a new rating', async () => {
    const rating = new Rating({
      movie_id: 1,
      email: 'test@mail.com',
      rating: 4,
    });
    expect(rating).toMatchObject({
      movie_id: 1,
      email: 'test@mail.com',
      rating: 4,
    });
  });

  it('should throw an error if required fields are missing', async () => {
    const rating = new Rating();
    try {
      await rating.validate();
    } catch (err) {
      expect(err.errors.movie_id).toBeDefined();
      expect(err.errors.email).toBeDefined();
      expect(err.errors.rating).toBeDefined();
    }
  });
});
