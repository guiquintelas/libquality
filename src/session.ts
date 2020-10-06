import session from "express-session";

require("dotenv").config();

export type MySession = {
  repos: number[]
}

const secret = process.env.APP_SESSION_SECRET

if (!secret || secret === "your secret") {
  throw new Error("Please set the session secret!")
}

export const sessionSettings: session.SessionOptions = {
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.APP_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 365
  }
}
