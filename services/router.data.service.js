'use strict';

const express = require('express');
const multer = require('multer');

const dataRouter = (dataService) => {
  // set storage location and file name
  const storage = multer.diskStorage({
    destination: 'images',
    filename: function (req, file, cb) {
      const recId = req.params.id ? parseInt(req.params.id) : dataService.getNextId();
      if (!req.params.id) {
        req.body.reservedId = recId;
      }
      const fileName = `${dataService.collectionName}_${recId}.${file.mimetype.split('/')[1]}`;
      req.body.image = fileName;
      cb(null, fileName);
    }
  });
  const upload = multer({ storage: storage });

  const router = express.Router();

  router
    .all('*', async (req, res, next) => {
      if (!dataService || !dataService.isReady) {
        res.sendStatus(503);  // Service Unavailable
      } else {
        next();
      }
    })

    // GET /:id
    .get('/:id', asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const doc = await dataService.getById(id);
      res.json(doc);
    }))

    // GET
    .get('/', asyncHandler(async (req, res) => {
      const docs = await dataService.getAll();
      res.json(docs);
    }))

    // POST
    .post('/', upload.single('image'), asyncHandler(async (req, res) => {
      const newRec = { ...req.body };
      dataService.insert(newRec)
        .then(doc => res.send(doc));
    }))

    // PUT
    .put('/:id', upload.single('image'), asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      dataService.update(id, { ...req.body })
        .then(result => res.send(result));
    }))

    // DELETE /:id
    .delete('/:id', asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      dataService.remove(id)
        .then(result => res.send(result));
    }));

  return router;
};

const asyncHandler = (fn) => (req, res, next) => {
  return Promise
    .resolve(fn(req, res, next))
    .catch(next);
};

module.exports = dataRouter;
