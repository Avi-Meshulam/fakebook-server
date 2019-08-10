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
  .post('/', async function (req, res, next) {
    const post = await posts.add(req.body);
    if (post) {
      res.send(JSON.stringify(post));
    } else {
      next(`Cannot add post\n${req.body}`);
    }
  })

  // PUT /:id
  .put('/:id', async function (req, res, next) {
    const id = parseInt(req.params.id);
    if (await posts.update(id, req.body)) {
      res.send(JSON.stringify(post));
    } else {
      next(`Cannot find post with id=${req.params.id}`);
    }
  })

  // DELETE /:id
  .delete('/:id', async function (req, res, next) {
    const id = parseInt(req.params.id);
    if (await posts.remove(id)) {
      res.send(`Post with id=${id} has been deleted`);
    } else {
      next(`Cannot find post with id=${req.params.id}`);
    }
  });

module.exports = router;
