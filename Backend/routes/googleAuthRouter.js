import express from "express";
import {
  oauthStart,
  oauthCallback,
  loginWithIdToken,
} from "../controllers/googleAuthController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ ok: true, provider: "google", routes: ["/start", "/callback", "/id-token"] });
});

router.get("/start", oauthStart);

router.get("/callback", oauthCallback);

router.post("/id-token", express.json(), async (req, res, next) => {
  try {
    const idToken = req.body?.id_token || req.body?.credential;
    if (!idToken) {
      return res.status(400).json({ error: "Missing id_token (or credential) in request body" });
    }
    const result = await loginWithIdToken(idToken, req, res);
    if (res.headersSent) return;
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
