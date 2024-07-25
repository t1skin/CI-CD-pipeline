import express, { Router } from 'express';
import * as messageService from '../controllers/messages.controller';

const router: Router = express.Router();

// here we define our routes
router.post('/add/message', messageService.addMessage);
router.get('/', messageService.getMessages);
router.put('/edit/:messageId', messageService.editMessage);
router.delete('/delete/:messageId', messageService.deleteMessage);
router.get('/:messageId', messageService.getMessageById);

module.exports = router;
