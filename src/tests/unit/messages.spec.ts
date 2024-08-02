import { Request, Response } from 'express';
import {
  getMessages,
  getMessageById,
  addMessage,
  editMessage,
  deleteMessage,
} from '../../controllers/messages.controller';

import mongoose from 'mongoose';
import messageModel from '../../models/messageModel';
import statusCodes from '../../constants/statusCodes';
import { IMessage } from '../../interfaces/message.interface';
import { IRequestWithUser } from '../../interfaces/requestWithUser.interface';

jest.mock('../../boot/database/db_connect');
jest.mock('../../models/messageModel');

describe('Messages Controller', () => {
  describe('getMessages', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = {};
      statusMock = jest.fn().mockReturnThis();
      jsonMock = jest.fn();
      res = {
        status: statusMock,
        json: jsonMock,
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return all messages', async () => {
      const mockMessages: IMessage[] = [
        {
          name: 'test-name-1',
          user: new mongoose.Types.ObjectId('667ac20200bc26c9c8043c39'),
        },
        {
          name: 'test-name-2',
          user: new mongoose.Types.ObjectId('667ac20200bc26c9c8043c40'),
        },
      ];

      jest.spyOn(messageModel, 'find').mockResolvedValue(mockMessages);

      await getMessages(req as Request, res as Response);

      expect(messageModel.find).toHaveBeenCalledWith({});
      expect(statusMock).toHaveBeenCalledWith(statusCodes.success);
      expect(jsonMock).toHaveBeenCalledWith(mockMessages);
    });
  });

  describe('getMessageById', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = {};
      statusMock = jest.fn().mockReturnThis();
      jsonMock = jest.fn();
      res = {
        status: statusMock,
        json: jsonMock,
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should get message by id', async () => {
      req = {
        params: { messageId: '1' },
      };

      const sampleMessage: IMessage = {
        name: 'test-name-1',
        user: new mongoose.Types.ObjectId('667ac20200bc26c9c8043c39'),
      };

      jest.spyOn(messageModel, 'findById').mockResolvedValue(sampleMessage);

      await getMessageById(req as Request, res as Response);

      expect(messageModel.findById).toHaveBeenCalledWith('1');
      expect(statusMock).toHaveBeenCalledWith(statusCodes.success);
      expect(jsonMock).toHaveBeenCalledWith(sampleMessage);
    });

    it('should return 400 when called without message id', async () => {
      req = {
        params: { messageId: '' },
      };

      await getMessageById(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'missing message id',
      });
    });

    it('should handle errors during message fetching by id', async () => {
      const error = new Error('Database error');

      jest.spyOn(messageModel, 'findById').mockRejectedValueOnce(error);

      req = {
        params: { messageId: '1' },
      };

      await getMessageById(req as Request, res as Response);

      expect(messageModel.findById).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Error while getting message',
      });
    });
  });

  describe('addMessage', () => {
    let req: Partial<IRequestWithUser>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = { user: { id: 1, email: 'test@mail.com' } };
      statusMock = jest.fn().mockReturnThis();
      jsonMock = jest.fn();
      res = {
        status: statusMock,
        json: jsonMock,
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should add a new message', async () => {
      const sampleMessage = {
        name: 'test-msg',
        user: 1,
      };

      req = {
        body: {
          message: { name: 'test-msg' },
        },
        user: {
          id: 1,
          email: 'test@test.com',
        },
      };

      await addMessage(req as IRequestWithUser, res as Response);

      expect(messageModel).toHaveBeenCalledTimes(1);
      expect(messageModel).toHaveBeenCalledWith(sampleMessage);
      expect(statusMock).toHaveBeenCalledWith(statusCodes.success);
    });

    it('should fail if user is not authenticated', async () => {
      req = {
        body: {
          message: { name: 'test-msg' },
        },
      };

      await addMessage(req as IRequestWithUser, res as Response);

      expect(statusMock).toHaveBeenCalledWith(statusCodes.unauthorized);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'You are not authenticated',
      });
    });

    it('should fail if info is missing', async () => {
      req = {
        body: {},
        user: {
          id: 1,
          email: 'test@test.com',
        },
      };

      await addMessage(req as IRequestWithUser, res as Response);

      expect(statusMock).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should handle errors during message addition', async () => {
      const error = new Error('Database error');

      jest.spyOn(messageModel.prototype, 'save').mockRejectedValueOnce(error);

      req = {
        body: {
          message: { name: 'test-msg' },
        },
        user: {
          id: 1,
          email: 'test@test.com',
        },
      };

      await addMessage(req as IRequestWithUser, res as Response);

      expect(messageModel.prototype.save).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to add message',
      });
    });
  });

  describe('editMessage', () => {
    let req: Partial<IRequestWithUser>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = { user: { id: 1, email: 'test@mail.com' } };
      statusMock = jest.fn().mockReturnThis();
      jsonMock = jest.fn();
      res = {
        status: statusMock,
        json: jsonMock,
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should edit message by id', async () => {
      const sampleMessage: IMessage = {
        name: 'new-awesome-name',
        user: new mongoose.Types.ObjectId('667ac20200bc26c9c8043c39'),
      };

      req = {
        body: { name: 'new-awesome-name' },
        params: { messageId: '1' },
      };

      // (messageModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
      //   sampleMessage,
      // );

      jest
        .spyOn(messageModel, 'findByIdAndUpdate')
        .mockResolvedValue(sampleMessage);

      await editMessage(req as Request, res as Response);

      expect(messageModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        { name: 'new-awesome-name' },
        { new: true },
      );
      expect(statusMock).toHaveBeenCalledWith(statusCodes.success);
      expect(jsonMock).toHaveBeenCalledWith(sampleMessage);
    });

    it('should return 400 if messageId is missing', async () => {
      req = {
        body: {},
        params: {},
      };

      await editMessage(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should handle errors during message editing', async () => {
      const error = new Error('Database error');

      jest
        .spyOn(messageModel, 'findByIdAndUpdate')
        .mockRejectedValueOnce(error);

      req = {
        body: { name: 'new-awesome-name' },
        params: { messageId: '1' },
      };

      await editMessage(req as Request, res as Response);

      expect(messageModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to update message',
      });
    });
  });

  describe('deleteMessage', () => {
    let req: Partial<IRequestWithUser>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      req = { user: { id: 1, email: 'test@mail.com' } };
      statusMock = jest.fn().mockReturnThis();
      jsonMock = jest.fn();
      res = {
        status: statusMock,
        json: jsonMock,
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should delete message by id', async () => {
      // (messageModel.findByIdAndDelete as jest.Mock).mockResolvedValueOnce(true);

      jest.spyOn(messageModel, 'findByIdAndDelete').mockResolvedValue(true);

      req = {
        params: { messageId: '1' },
      };

      await deleteMessage(req as Request, res as Response);

      expect(messageModel.findByIdAndDelete).toHaveBeenCalledWith('1');
      expect(statusMock).toHaveBeenCalledWith(statusCodes.success);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Message deleted' });
    });

    it('should return 400 if messageId is missing', async () => {
      req = {
        params: {},
      };

      await deleteMessage(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should handle errors during message deletion', async () => {
      const error = new Error('Database error');

      jest
        .spyOn(messageModel, 'findByIdAndDelete')
        .mockRejectedValueOnce(error);

      req = {
        params: { messageId: '1' },
      };

      await deleteMessage(req as Request, res as Response);

      expect(messageModel.findByIdAndDelete).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to delete message',
      });
    });
  });
});
