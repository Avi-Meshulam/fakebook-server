'use strict';

const Router = require('express').Router;
const DataService = require('../data/services/IDataService');
const { configFileStorage, filterObj, generateFileName } = require('../utils');
const multer = require('multer');
const routerService = require('./router.service');
const asyncHandler = require('../utils').asyncHandler;

const postsRouter = (dataService = new DataService()) => {
  // const storage = configFileStorage('post', 'images', dataService.getNextId);
  const storage = multer.memoryStorage();
  const upload = multer({ storage });
  const router = Router();

  let result;

  router
    .get('*', asyncHandler(async (req, res, next) => {
      req.body = { ...req.body, projection: { imageData: 0 }, sort: {_id: -1} };
      next();
    }))
    .post('/', upload.single('image'), asyncHandler(async (req, res, next) => {
      setFileData(req);
      const { imageData, ...result } = await dataService.insert(req.body);
      res.json(result);
    }))
    .put('/', upload.single('image'), asyncHandler(async (req, res, next) => {
      setFileData(req);
      const { imageData, ...result } = await dataService.update(req.query, req.body);
      res.json(result);
    }))
    .put('/:id', upload.single('image'), asyncHandler(async (req, res, next) => {
      setFileData(req);
      const { imageData, ...result } = await dataService.updateById(req.params.id, req.body);
      res.json(result);
    }));

  router.use(routerService(dataService));

  return router;
};

const setFileData = (req) => {
  if (req.file) {
    req.body.image = generateFileName(req.file);
    req.body.imageData = req.file.buffer;
  }
};

module.exports = postsRouter;
