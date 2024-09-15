const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Setup Config File
dotenv.config({
  path: './config.env'
});
// Import Express App
const app = require('./app');
// Use Environment with Database
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
// Connect Mongoose to DB
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful'));

// Test Server
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`Node app running on port ${port}`);
});

// Unhandled Promise Rejections
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

// Uncaught Exceptions
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Delay SIGTERM Forced Close on Heroku
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully...');
  // All HTTP Requests are completed prior to closing.
  server.close(() => {
    console.log('Process termindated.');
  });
});
