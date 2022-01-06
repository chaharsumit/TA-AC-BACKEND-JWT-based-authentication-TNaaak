const mongoose = require('mongoose');
const slug = require('slug');

const Schema = mongoose.Schema;

const articleSchema = new Schema({
  slug: String,
  title: { type: String, required: true },
  description: String,
  body: String,
  tagList: [String],
  favourited: { type: Boolean, default: false },
  favouritesCount: { type: Number, default: 0 },
  author: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;