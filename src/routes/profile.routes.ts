import express, { Router } from 'express';
import profileServices from '../controllers/profile.controller';

const router: Router = express.Router();

router.put('/', profileServices.editPassword);
router.post('/', profileServices.logout);

export default router;
