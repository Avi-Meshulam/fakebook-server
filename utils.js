'use strict';

const multer = require('multer');

const configFileStorage = (entityName, destination, getNextId) => {
  return multer.diskStorage({
    destination,
    filename: function (req, file, cb) {
      const recId = req.params.id ? req.params.id : getNextId();
      const fileName = `${entityName}_${recId}.${file.mimetype.split('/')[1]}`;
      if (!req.params.id) {
        req.body.reservedId = recId;
      }
      req.body[file.fieldname] = fileName;
      cb(null, fileName);
    }
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  return Promise
    .resolve(fn(req, res, next))
    // .then(result => res.json(result))
    .catch(next);
};

// converts a function that takes a callback to a function 
// that returns a promise. In case input param is an object => 
// promisify all its functions.
const promisify = (param) => {
  const promisifyFunc = (func) => (...params) =>
    new Promise((resolve, reject) => {
      func(...params, (err, data) => err ? reject(err) : resolve(data || true));
    });

  const promisifyObj = (obj) => (
    Object.keys(obj)
      .filter(key => typeof obj[key] === 'function')
      .reduce((acc, cur) => ({ ...acc, [cur]: promisifyFunc(obj[cur]) }), {})
  );
  switch (typeof param) {
    case 'function':
      return promisifyFunc(param);
    case 'object':
      return promisifyObj(param);
    default:
      break;
  }
};

const generateFileName = (file) => {
  const name = file.originalname.split('.')[0];
  const ext = file.mimetype.split('/')[1];
  return `${name}_${hash()}.${ext}`;
};

// helper functions

const hash = () => Math.random().toString(36).substr(2) + (+new Date()).toString(36);

// returns a copy of the input object containing only the specified fields
function filterObj(obj, fieldsToKeep = undefined, fieldsToRemove = undefined) {
  if (!fieldsToRemove && !fieldsToKeep || fieldsToRemove.length === 0 && fieldsToKeep.length === 0) {
    return obj;
  }
  const result = {};
  Object.keys(obj).forEach(key => {
    if (fieldsToKeep && fieldsToKeep.includes(key) || fieldsToRemove && !fieldsToRemove.includes(key)) {
      result[key] = obj[key];
    }
  });
  return result;
}

module.exports = {
  asyncHandler,
  configFileStorage,
  filterObj,
  generateFileName,
  promisify,
};
