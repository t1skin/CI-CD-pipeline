import express, { Router } from 'express';
import * as ratingService from '../controllers/rating.controller';

const router: Router = express.Router();

router.post('/:movieId', ratingService.addRating);

module.exports = router;
