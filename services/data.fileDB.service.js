'use strict';

const fs = require('fs');
const path = require('path');
const promisify = require('../promisify');

const fsp = promisify(fs);

const data = new Map();
const nextIds = new Map();
const isLoaded = new Map();
const idFields = new Map();
const mutableFields = new Map();

const fileName = (collectionName) => path.join(__dirname, '../data/', `${collectionName}.json`);

const getCollection = (collectionName) => {
  if (data.has(collectionName)) {
    return data.get(collectionName);
  } else {
    throw `collection ${collectionName} is not loaded`;
  }
};

class FileDBService {
  constructor(collectionName, collectionIdField = 'id', collectionMutableFields = []) {
    load(collectionName, collectionIdField, collectionMutableFields);
    this._collectionName = collectionName;
    this.isReady = isReady.bind(null, collectionName);
    this.getAll = getAll.bind(null, collectionName);
    this.getById = getById.bind(null, collectionName);
    this.insert = insert.bind(null, collectionName);
    this.update = update.bind(null, collectionName);
    this.remove = remove.bind(null, collectionName);
    this.getNextId = getNextId.bind(null, collectionName);
  }
  get collectionName() {
    return this._collectionName;
  }
}

function load(collectionName, collectionIdField = 'id', collectionMutableFields = []) {
  if (isLoaded.get(collectionName)) {
    console.log(`${collectionName} is loaded`);
    return;
  }
  if (isLoaded.get(collectionName) === false) {
    console.log(`${collectionName} is loading`);
    return;
  }
  loadCollection(collectionName);
  idFields.set(collectionName, collectionIdField);
  mutableFields.set(collectionName, collectionMutableFields);
}

function isReady(collectionName) {
  return isLoaded.get(collectionName) ? true : false;
}

function getAll(collectionName) {
  const collection = getCollection(collectionName);
  return [...collection.values()];
}

function getById(collectionName, id) {
  const collection = getCollection(collectionName);
  return collection.get(id);
}

async function insert(collectionName, data) {
  const collection = getCollection(collectionName);
  const id = data.reservedId || getNextId(collectionName);
  const filtered = filterObj(data, mutableFields.get(collectionName));
  const rec = { [idFields.get(collectionName)]: id, ...filtered, [idFields.get(collectionName)]: id };
  collection.set(id, rec);
  return await trySave(collectionName)
    .then(() => rec)
    .catch(err => {
      // rollback
      collection.delete(id);
      throw err;
    });
}

async function update(collectionName, id, data) {
  const collection = getCollection(collectionName);
  const oldRec = collection.get(id);
  if (oldRec) {
    const filtered = filterObj(data, mutableFields.get(collectionName));
    const newRec = { ...oldRec, ...filtered, [idFields.get(collectionName)]: id };
    collection.set(id, newRec);
    return await trySave(collectionName)
      .then(() => newRec)
      .catch(err => {
        // rollback
        collection.set(id, oldRec);
        throw err;
      });
  }
}

async function remove(collectionName, id) {
  const collection = getCollection(collectionName);
  const rec = collection.get(id);
  if (rec) {
    collection.delete(id);
    return await trySave(collectionName)
      .then(() => true)
      .catch(err => {
        // rollback
        collection.set(id, rec);
        throw err;
      });
  }
}

function getNextId(collectionName) {
  const id = nextIds.get(collectionName);
  nextIds.set(collectionName, id + 1);
  return id;
}

/*** Helper Functions ***/

// Load data, cache it and set nextId
function loadCollection(collectionName) {
  isLoaded.set(collectionName, false);
  const collection = new Map();
  let nextId = 0;
  const fileData = JSON.parse(fs.readFileSync(fileName(collectionName), 'utf8'));
  fileData.forEach(rec => {
    collection.set(rec.id, rec);
    if (rec.id > nextId) {
      nextId = rec.id;
    }
  });
  data.set(collectionName, collection);
  nextIds.set(collectionName, nextId + 1);
  isLoaded.set(collectionName, true);
  console.log(`Successfully loaded ${collectionName}`);
}

// returns a copy of the input object containing only the specified fields
function filterObj(obj, fieldsToKeep) {
  if (!fieldsToKeep || fieldsToKeep.length === 0) {
    return obj;
  }
  const result = {};
  Object.keys(obj).forEach(key => {
    if (fieldsToKeep.includes(key)) {
      result[key] = obj[key];
    }
  });
  return result;
}

async function trySave(collectionName) {
  return fsp.writeFile(fileName(collectionName),
    JSON.stringify([...data.get(collectionName).values()], null, 2)
  );
}

module.exports = FileDBService;
