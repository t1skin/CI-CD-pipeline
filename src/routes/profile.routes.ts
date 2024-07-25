import express, { Router } from 'express';
import * as profileServices from '../controllers/profile.controller';

const router: Router = express.Router();

router.put('/', profileServices.editPassword);
router.post('/', profileServices.logout);

module.exports = router;
