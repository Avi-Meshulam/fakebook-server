const express = require('express');

const router = express.Router();

router
  /* GET home page. */
  .get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
  });

module.exports = router;
