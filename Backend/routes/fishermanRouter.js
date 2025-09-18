import express from "express";
import { listFishermen, loginFisherman, registerFisherman } from "../controllers/fishermanController.js";

const fishermanRouter = express.Router();

fishermanRouter.post("/register", registerFisherman);
fishermanRouter.post("/login", loginFisherman);
fishermanRouter.get('/', listFishermen);


export default fishermanRouter;
