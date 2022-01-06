const mongoose = require('mongoose');
const slug = require('slug');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  body: {type: String, required: true},
  author: { type: String, ref: "User" },
  article: { type: String, ref: "Article" } 
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;