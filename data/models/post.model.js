'use strict';

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  _id: Number,
  text: { type: String, required: true },
  image: String,
  imageData: Buffer,
  createdAt: { type: Date, default: new Date() }
}, { versionKey: false });

const PostModel = mongoose.model('Post', postSchema);

module.exports = PostModel;
