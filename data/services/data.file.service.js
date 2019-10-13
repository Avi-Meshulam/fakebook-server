'use strict';

const fs = require('fs');
const path = require('path');
const {filterObj, promisify} = require('../../utils');
const DataServiceModel = require('./data.service.model');

const fsp = promisify(fs);

// Cache objects
const dataCache = new Map();
const nextIdsCache = new Map();
const isLoadedCache = new Map();
const idFieldsCache = new Map();
const mutableFieldsCache = new Map();

class FileDataService extends DataServiceModel {
  constructor(collectionName, idField = 'id', mutableFields = []) {
    super();
    loadCollection(collectionName, idField, mutableFields);
    this._collectionName = collectionName;
  }

  get collectionName() {
    return this._collectionName;
  }

  isReady() {
    return isLoadedCache.get(this._collectionName) ? true : false;
  }

  get() {
    const collection = getCollection(this._collectionName);
    return [...collection.values()];
  }

  getById(id) {
    const collection = getCollection(this._collectionName);
    return collection.get(id);
  }

  async insert(data) {
    const collection = getCollection(this._collectionName);
    const id = data.reservedId || this.getNextId();
    const filtered = filterObj(data, mutableFieldsCache.get(this._collectionName));
    const rec = { [idFieldsCache.get(this._collectionName)]: id, ...filtered, [idFieldsCache.get(this._collectionName)]: id };
    collection.set(id, rec);
    return await trySave(this._collectionName)
      .then(() => rec)
      .catch(err => {
        // rollback
        collection.delete(id);
        throw err;
      });
  }

  // async update(filter, data) { return Promise.resolve([]); }

  async updateById(id, data) {
    const collection = getCollection(this._collectionName);
    const oldRec = collection.get(id);
    if (oldRec) {
      const filtered = filterObj(data, mutableFieldsCache.get(this._collectionName));
      const newRec = { ...oldRec, ...filtered, [idFieldsCache.get(this._collectionName)]: id };
      collection.set(id, newRec);
      return await trySave(this._collectionName)
        .then(() => newRec)
        .catch(err => {
          // rollback
          collection.set(id, oldRec);
          throw err;
        });
    }
  }

  // async remove(filter) { return Promise.resolve(false); }

  async removeById(id) {
    const collection = getCollection(this._collectionName);
    const rec = collection.get(id);
    if (rec) {
      collection.delete(id);
      return await trySave(this._collectionName)
        .then(() => true)
        .catch(err => {
          // rollback
          collection.set(id, rec);
          throw err;
        });
    }
  }

  getNextId() {
    const id = nextIdsCache.get(this._collectionName);
    nextIdsCache.set(id + 1);
    return id;
  }
}

/*** Helper Functions ***/

const fileName = (collectionName) => path.join(__dirname, `../${collectionName}.json`);

const getCollection = (collectionName) => {
  if (dataCache.has(collectionName)) {
    return dataCache.get(collectionName);
  } else {
    throw `collection ${collectionName} is not loaded`;
  }
};

async function loadCollection(collectionName, idField = 'id', mutableFields = []) {
  if (isLoadedCache.get(collectionName)) {
    console.log(`${collectionName} is loaded`);
    return;
  }
  if (isLoadedCache.get(collectionName) === false) {
    console.log(`${collectionName} is loading`);
    return;
  }
  await loadFile(collectionName);
  idFieldsCache.set(collectionName, idField);
  mutableFieldsCache.set(collectionName, mutableFields);
}

// Load data, cache it and set nextId
async function loadFile(collectionName) {
  isLoadedCache.set(collectionName, false);
  const collection = new Map();
  let nextId = 0;
  const fileData = JSON.parse(await fsp.readFile(fileName(collectionName), 'utf8'));
  fileData.forEach(rec => {
    collection.set(rec.id, rec);
    if (rec.id > nextId) {
      nextId = rec.id;
    }
  });
  dataCache.set(collectionName, collection);
  nextIdsCache.set(collectionName, nextId + 1);
  isLoadedCache.set(collectionName, true);
  console.log(`Successfully loaded ${collectionName}`);
}

async function trySave(collectionName) {
  return fsp.writeFile(fileName(collectionName),
    JSON.stringify([...dataCache.get(collectionName).values()], null, 2)
  );
}

module.exports = FileDataService;
