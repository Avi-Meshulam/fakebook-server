require('./polyfills');

const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const imagesRouter = require('./routers/imagesRouter');
const indexRouter = require('./routers/index');
const postsRouter = require('./routers/postsRouter');
const MongooseDataService = require('./data/services/data.db.service');

const app = express();
const postsDataService = new MongooseDataService('post');

// middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// routes
app.use('/', indexRouter);
app.use('/api/posts', postsRouter(postsDataService));
app.use('/images', imagesRouter(postsDataService));
// app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  let err = new Error('404 Not Found');
  err.status = 404;
  next(err);
});

// uncaught error handling
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message
    }
  });
});

module.exports = app;
