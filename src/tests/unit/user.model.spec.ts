import userModel from '../../models/userModel';

describe('User Model', () => {
  it('should create a new user', async () => {
    const user = new userModel({
      username: ' test ',
      email: 'Test@mail.com ',
      password: ' password',
      messages: [],
    });
    expect(user).toMatchObject({
      username: 'test',
      email: 'test@mail.com',
      password: 'password',
      messages: [],
    });
  });

  it('should throw an error if required fields are missing', async () => {
    const user = new userModel();
    try {
      await user.validate();
    } catch (err) {
      expect(err.errors.email).toBeDefined();
      expect(err.errors.password).toBeDefined();
    }
  });
})
