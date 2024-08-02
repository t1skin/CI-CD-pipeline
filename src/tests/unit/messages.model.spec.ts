import Message from '../../models/messageModel';
import mongoose from 'mongoose';

describe('Message Model', () => {
  it('should create a new message', async () => {
    const message = new Message({
      name: 'test-name',
      user: new mongoose.Types.ObjectId('667ac20200bc26c9c8043c39'),
    });
    expect(message).toMatchObject({
      name: 'test-name',
      user: new mongoose.Types.ObjectId('667ac20200bc26c9c8043c39'),
    });
  });

  it('should throw an error if required fields are missing', async () => {
    const message = new Message();
    try {
      await message.validate();
    } catch (err) {
      expect(err.errors.name).toBeDefined();
      expect(err.errors.user).toBeDefined();
    }
  });
});
