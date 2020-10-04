require("dotenv").config();

export type MySession = {
  repos: number[]
}

export const sessionSettings = {
  secret: process.env.APP_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.APP_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 365
    }
}