import express, { Router, Request, Response } from 'express';

const router: Router = express.Router();

router.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'All up and running !!',
  });
});

export default router;
