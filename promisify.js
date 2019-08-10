'use strict';

const promisifyFunc = (func) => (...params) =>
  new Promise((resolve, reject) => {
    func(...params, (err, data) => err ? reject(err) : resolve(data || true));
  });

const promisifyObj = (obj) => (
  Object.keys(obj)
    .filter(key => typeof obj[key] === 'function')
    .reduce((acc, cur) => ({ ...acc, [cur]: promisifyFunc(obj[cur]) }), {})
);

const promisify = (param) => {
  switch (typeof param) {
    case 'function':
      return promisifyFunc(param);
    case 'object':
      return promisifyObj(param);
    default:
      break;
  }
};

module.exports = promisify;
