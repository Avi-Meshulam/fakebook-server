const fs = require('fs');
const path = require('path');
const promisify = require('../promisify');

const fsp = promisify(fs);

const postsFile = path.join(__dirname, './posts.json');
const posts = new Map();

// Load and cache data and set nextId
let nextId = 0;
JSON.parse(fs.readFileSync(postsFile, 'utf8')).forEach(post => {
  if (post.id && Number.isInteger(post.id)) {
    posts.set(post.id, post);
    if (post.id > nextId) {
      nextId = post.id;
    }
  }
});
nextId++;

const getAll = () => {
  return [...posts.values()];
};

const getById = (id) => {
  return posts.get(id);
};

// return new post OR undefined
const insert = async (data) => {
  const id = nextId++;
  const post = { ...data, id };
  posts.set(id, post);
  return await trySave()
    .then(() => post)
    .catch(() => {
      // rollback
      posts.delete(id);
    });
};

// return true if post found
const update = async (id, data) => {
  const oldPost = posts.get(id);
  if (oldPost) {
    // add id at the end to ensure that it doesn't get updated
    const newPost = { ...oldPost, ...data, id };
    posts.set(id, newPost);
    return await trySave()
      .then(() => true)
      .catch(() => {
        // rollback
        posts.set(id, oldPost);
      });
  }
};

// return true if post found
const remove = async (id) => {
  const post = posts.get(id);
  if (post) {
    posts.delete(id);
    return await trySave()
      .then(() => true)
      .catch(() => {
        // rollback
        posts.set(id, post);
      });
  }
};

function trySave() {
  return new Promise((resolve, reject) => {
    fsp.writeFile(postsFile, JSON.stringify([...posts.values()], null, 2))
      .then(res => resolve(res))
      .catch(err => {
        console.error(err.message);
        reject(err);
      });
  });
}

module.exports = {
  getAll,
  getById,
  insert,
  update,
  remove
};
