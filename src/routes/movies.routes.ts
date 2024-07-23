import express, { Router } from 'express';
import * as movieServices from '../controllers/movies.controller';

const router: Router = express.Router();

router.get('/', movieServices.getMovies);
router.get('/top', movieServices.getTopRatedMovies);
router.get('/me', movieServices.getSeenMovies);

module.exports = router;
