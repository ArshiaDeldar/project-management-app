import "dotenv/config";

import session from "express-session";
import connectPgSimple from "connect-pg-simple";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not defined");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const PgSessionStore = connectPgSimple(session);

const sessionStore = new PgSessionStore({
  conString: process.env.DATABASE_URL,
  tableName: "user_sessions",
  createTableIfMissing: true,
});

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const sessionMiddleware = session({
  name: "pm.sid",
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: sessionCookieOptions,
});
