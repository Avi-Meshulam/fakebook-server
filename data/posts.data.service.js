const fs = require('fs');
const path = require('path');

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
const add = (data) => {
  const post = { ...data, id: nextId++ };
  posts.set(id, post);
  if (trySave()) {
    return post;
  } else {
    // rollback
    posts.delete(id);
  }
};

// return true if post found
const update = (id, data) => {
  const oldPost = posts.get(id);
  if (oldPost) {
    // add id at the end to ensure that it doesn't get updated
    const newPost = { ...oldPost, ...data, id };
    posts.set(id, newPost);
    if (trySave()) {
      return true;
    } else {
      // rollback
      posts.set(id, oldPost);
    }
  }
};

// return true if post found
const remove = (id) => {
  const post = posts.get(id);
  if (post) {
    posts.delete(id);
    if (trySave()) {
      return true;
    } else {
      // rollback
      posts.set(id, post);
    }
  }
};

function trySave() {
  fs.writeFile(postsFile, JSON.stringify([...posts.values()], null, 2), (err) => {
    if (err) {
      console.error(err.message);
    } else {
      return true;
    }
  });
}

module.exports = {
  getAll,
  getById,
  add,
  update,
  remove
};
