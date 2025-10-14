import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import Customer from "../models/customer.js";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  JWT_KEY,
  CLIENT_URL,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI || !JWT_KEY) {
  console.warn(
    "[googleAuthController] Missing env: GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, JWT_KEY (and GOOGLE_CLIENT_SECRET for code exchange)."
  );
}

const oauthClient = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: GOOGLE_REDIRECT_URI,
});

function signAppJwt(user) {
  const payload = {
    id: String(user._id),
    email: user.email,
    role: user.role || "customer",
    provider: user.provider || "google",
  };
  return jwt.sign(payload, JWT_KEY, { expiresIn: "7d" });
}

async function findOrCreateUserFromGooglePayload(googlePayload) {
  const googleId = googlePayload.sub;
  const email = (googlePayload.email || "").toLowerCase();
  const emailVerified = !!googlePayload.email_verified;
  const givenName = googlePayload.given_name || "";
  const familyName = googlePayload.family_name || "";
  const name =
    googlePayload.name ||
    `${givenName} ${familyName}`.trim();
  const avatar = googlePayload.picture || "";

  if (!email) throw new Error("Google account has no email.");

  let user = await Customer.findOne({ googleId });
  if (!user) user = await Customer.findOne({ email });

  if (user) {
    user.googleId = user.googleId || googleId;
    user.provider = "google";
    user.firstName = user.firstName || givenName || user.firstName;
    user.lastName = user.lastName || familyName || user.lastName;
    user.avatar = avatar || user.avatar;
    user.isEmailVerified = emailVerified;
    user.lastLogin = new Date();
    await user.save();
    return user;
  }

  user = await Customer.create({
    email,
    firstName: givenName || "Google",
    lastName: familyName || "User",
    role: "customer",
    provider: "google",
    googleId,
    avatar,
    isEmailVerified: emailVerified,
    lastLogin: new Date(),
  });

  return user;
}

async function verifyIdToken(idToken) {
  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

export async function oauthStart(req, res, next) {
  try {
    const url = oauthClient.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["openid", "email", "profile"],
    });
    return res.redirect(url);
  } catch (err) {
    next(err);
  }
}

export async function oauthCallback(req, res, next) {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: "Missing authorization code" });

    const { tokens } = await oauthClient.getToken(code);
    if (!tokens || !tokens.id_token) {
      return res.status(400).json({ error: "No id_token returned by Google" });
    }

    const payload = await verifyIdToken(tokens.id_token);
    const user = await findOrCreateUserFromGooglePayload(payload);
    const appToken = signAppJwt(user);

    const safeUser = {
      id: user._id,
      email: user.email,
      firstName: user.firstName || payload.given_name || "",
      lastName: user.lastName || payload.family_name || "",
      avatar: user.avatar || payload.picture || "",
      role: user.role || "customer",
      provider: user.provider || "google",
    };

    const frontend = CLIENT_URL || "http://localhost:5173";
    const url =
      `${frontend}/login?g=1` +
      `&token=${encodeURIComponent(appToken)}` +
      `&user=${encodeURIComponent(JSON.stringify(safeUser))}`;

    return res.redirect(url);

  } catch (err) {
    next(err);
  }
}

export async function loginWithIdToken(idToken, req, res) {
  const payload = await verifyIdToken(idToken);
  const user = await findOrCreateUserFromGooglePayload(payload);
  const appToken = signAppJwt(user);

  return {
    token: appToken,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName || payload.given_name || "",
      lastName: user.lastName || payload.family_name || "",
      avatar: user.avatar || payload.picture || "",
      role: user.role || "customer",
      provider: user.provider || "google",
    },
  };
}
