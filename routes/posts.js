const express = require('express');
const posts = require('../data/posts.data.service');

const router = express.Router();

router
  // GET /:id
  .get('/:id', function (req, res) {
    const id = parseInt(req.params.id);
    const post = posts.getById(id);
    if (post) {
      res.json(post);
    } else {
      res.send(`Cannot find post with id=${req.params.id}`);
    }
  })

  // GET 
  .get('/', function (req, res) {
    res.json(posts.getAll());
  })

  // POST
  .post('/', function (req, res) {
    const post = posts.add(req.body);
    if (post) {
      res.send(`Post with id=${id} has been added`);
    } else {
      res.send(`Cannot add post\n${req.body}`);
    }
  })

  // PUT /:id
  .put('/:id', function (req, res) {
    const id = parseInt(req.params.id);
    if (posts.update(id, req.body)) {
      res.send(`Post with id=${id} has been updated`);
    } else {
      res.send(`Cannot find post with id=${req.params.id}`);
    }
  })

  // DELETE /:id
  .delete('/:id', function (req, res) {
    const id = parseInt(req.params.id);
    if (posts.remove(id)) {
      res.send(`Post with id=${id} has been deleted`);
    } else {
      res.send(`Cannot find post with id=${req.params.id}`);
    }
  });

  module.exports = router;
