import { Router } from "express";
import { postChat } from "../controllers/chatController.js";

const chatRouter = Router();

chatRouter.post("/", postChat);

export default chatRouter;