require("dotenv").config();

module.exports = {
  "type": "mysql",
  "host": process.env.DB_HOST,
  "port": process.env.DB_PORT,
  "database": process.env.NODE_ENV === 'test' ?
    'testing' :
    process.env.DB_DATABASE,
  "username": process.env.DB_USERNAME,
  "password": process.env.DB_PASSWORD,
  "entities": process.env.NODE_ENV === 'test' ?
    ["src/**/**.entity{.ts,.js}"] :
    ["dist/**/*.entity{.ts,.js}"],
  "logging": process.env.NODE_ENV !== 'test',
  "logger": "file",
  "synchronize": true
}
