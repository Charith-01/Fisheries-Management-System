import express from "express";
import {
  loginFisherman,
  registerFisherman,
  listFishermen,
  getAllFishermen,
  adminDeleteFisherman,
  adminUpdateFisherman,
} from "../controllers/fishermanController.js";
import verifyJWT from "../middleware/auth.js";

const fishermanRouter = express.Router();

fishermanRouter.post("/register", registerFisherman);
fishermanRouter.post("/login", loginFisherman);

fishermanRouter.get("/", verifyJWT, listFishermen);
fishermanRouter.get("/all", verifyJWT, getAllFishermen);

fishermanRouter.patch("/:id", verifyJWT, adminUpdateFisherman);
fishermanRouter.delete("/:id", verifyJWT, adminDeleteFisherman);

export default fishermanRouter;
