import express from "express";
import { loginFisherman, registerFisherman } from "../controllers/fishermanController.js";

const fishermanRouter = express.Router();

fishermanRouter.post("/register", registerFisherman);
fishermanRouter.post("/login", loginFisherman);

export default fishermanRouter;
