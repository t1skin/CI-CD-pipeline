import express, { Router } from "express";
import * as commentServices from "../controllers/comments.controller";

const router: Router = express.Router();

router.get("/:movie_id", commentServices.getCommentsById);
router.post("/:movie_id", commentServices.addComment);

export default router;
