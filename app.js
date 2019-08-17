const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const FileDBService = require('./services/data.fileDB.service');
const indexRouter = require('./routes/index');
const dataRouter = require('./services/router.data.service');

const postsDataService = new FileDBService('posts', 'id', ['text', 'image']);
const postsRouter = dataRouter(postsDataService);

const app = express();

// middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// routes
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/api/posts', postsRouter);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  let err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message
    }
  });
});

module.exports = app;
