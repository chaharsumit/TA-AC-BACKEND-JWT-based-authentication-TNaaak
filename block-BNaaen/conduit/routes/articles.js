const express = require('express');
const Article = require('../models/Article');
const auth = require('../middlewares/auth');
const User = require('../models/User');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');
const slugger = require('slug');
const randomString = require('randomstring');
const router = express.Router();

// filter articles with queries

/*
router.get('/', auth.optionalVerify, async (req, res, next) => {
  // find and take queries
  let tags, author, favourited;
  let limit = 0;
  let offset = 0;
  let result = [];
  if(req.query.limit){
    limit = Number(req.query.limit);
  }
  if(req.query.offset){
    offset = Number(req.query.offset);
  }
  try{
    if(req.query.tag){
      tags = req.query.tag;
    }else{
      tags = await Article.find({}).distinct('tagList');
    }
    if(req.query.author){
      author = req.query.author;
      var user = await User.findOne({ username: author });
      var authorId = user.id;
    }else{
      var authorId = await Article.find({}).distinct('author');
    }
    if(!req.query.favourited){
      if(typeof(authorId) === 'string'){
        var articles = await Article.find({$and: [ {author: mongoose.Types.ObjectId(authorId)}, {tagList: {$in: tags}}]}).populate("author", "_id username bio image").limit(limit).skip(offset);
        articles.forEach(article => {
          result.push(article.articleJSON(undefined, req.user.followers));
        });
        return res.status(201).json({ result });
      }else{
        var articles = await Article.find({taglist: {$in: tags}}).populate('author', "_id username bio image").limit(limit).skip(offset);
        articles.forEach(article => {
          result.push(article.articleJSON(undefined, req.user.followers));
        });
        return res.status(201).json({ result });
      }
    }else{
      var favouritedUser = await User.findOne({ username: req.query.favourited });
      if(typeof(authorId === 'string')){
        let articles = await Article.find({$and: [{author: mongoose.Types.ObjectId(authorId)}, {_id: { $in: favouritedUser.favouriteArticles }}, {tagList: {$in: tags}}]}).populate('author', "_id username bio image").limit(limit).skip(offset);
        articles.forEach(article => {
          result.push(article.articleJSON(favouritedUser.favouriteArticles, req.user.followers));
        });
        return res.status(201).json({ result });
      }else{
        let articles = await Article.find({$and: [{_id: { $in: favouritedUser.favouriteArticles }}, {tagList: {$in: tags}}]}).populate('author', "_id username bio image").limit(limit).skip(offset);
        articles.forEach(article => {
          result.push(article.articleJSON(favouritedUser.favouriteArticles, req.user.followers));
        });
        return res.status(201).json({ result });
      }
    }
  }catch(error){
    next(error);
  }
});
*/

router.get('/', auth.optionalVerify, async (req, res, next) => {
  var limit = req.query.limit || 20;
  var skip = req.query.skip || 0;
  var queryArticle = {};
  try{
    if(req.query.tags) {
      queryArticle.tagList = req.query.tags;
      // {tags: "node"} -> queryArticle
    }
    if(req.query.author) {
      var author = await User.findOne({username: req.query.author});
      queryArticle.author = author.id;
      //{tags: "node", author: "7346543564564"}
    }
    // favourited
    if(req.query.favourited){
      var user = await User.findOne({username: req.query.favourited});
      queryArticle._id = {$in: user.favouriteArticles};
    }
    console.log(queryArticle);
  //{tags: "node", author: "7346543564564", favorited: "7645457574535"}
    var articles = await Article.find(queryArticle).skip(skip).limit(limit).populate('author',"_id username bio image");
    let result = [];
    articles.forEach(article => {
      result.push(article.articleJSON(req.user.favouriteArticles, req.user.followers));
    })
    res.status(201).json({ articles: result });
  }catch(error){
    next(error);
  }
});


// get articles feed

router.get('/feed', auth.verifyToken, async (req, res, next) => {
  let id = req.user.userId;
  let limit = offset = 0;
  let result = [];
  if(req.query.limit){
    limit = Number(req.query.limit);
  }
  if(req.query.offset){
    offset = Number(req.query.offset);
  }
  let followedUserIds = await User.find({followers: {$in: id}}).distinct('_id');
  let articles = await Article.find({author: {$in: followedUserIds}}).populate("author", "_id username bio image").limit(limit).skip(offset);
  articles.forEach(article => {
    result.push(article.articleJSON(req.user.favouriteArticles, req.user.followers));
  })
  return res.status(201).json({ result });
})

// create article

router.post('/', auth.verifyToken, async (req, res, next) => {
  req.body.author = req.user.userId;
  try{
    let article = await Article.create(req.body);
    let user = await User.findById(req.user.userId);
    article = await article.populate('author', '_id username bio image');
    res.status(201).json({ article: article.articleJSON() });
  }catch(error){
    next(error);
  }
});

// get article

router.get('/:slug', async (req, res, next) => {
  let slug = req.params.slug;
  try{
    let article = await Article.findOne({ slug }).populate('author', 'username bio image following');
    res.status(201).json({ article: article.articleJSON() });
  }catch(error){
    next(error);
  }
});


//edit article

/*
router.put('/:slug', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  try{
    let article = await Article.findOne({ slug });
    let user = await User.findById(req.user.userId);
    if(article.author.toString() === user.id){
      if(req.body.title){
        req.body.title = " " + randomString.generate(3);
        req.body.slug = slugger(req.body.title);
      }
      let updatedArticle = await Article.findOneAndUpdate({ slug }, req.body, { new: true }).populate("author", "username _id email bio image");
      res.status(201).json({ article: updatedArticle.articleJSON(user.favouriteArticles) });
    }else{
      res.status(400).json({ error: "You are not the author of this article and can't modify it." });
    }
  }catch(error){
    next(error);
  }
});
*/


router.put('/:slug', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  try{
    let article = await Article.findOne({ slug });
    if(!article){
      return res.status(400).json({ error: "No article found" });
    }else{
      if(req.body.title){
        article.title = req.body.title;
      }else if(req.body.body){
        article.body = req.body.body;
      }else if(req.body.tagList){
        article.tagList = req.body.tagList;
      }else if(req.body.description){
        article.description = req.body.description;
      }
      let user = await User.findById(req.user.userId);
      if(article.author.toString() === user.id){
        let updatedArticle = await article.save();
        updatedArticle = await updatedArticle.populate('author');
        res.status(201).json({ article: updatedArticle.articleJSON(user.favouriteArticles) });
      }else{
        res.status(400).json({ error: "You are not the author of this article and can't modify it." });
      }
    }
  }catch(error){
    next(error);
  }
});

// delete article

router.delete('/:slug', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  try{
    let article = await Article.findOne({ slug });
    let user = await User.findById(req.user.userId);
    if(article.author.toString() === user.id){
      let deletedArticle = await Article.findOneAndDelete({ slug });
      console.log(deletedArticle);
      let updatedUsers = await User.updateMany({$in: { favouriteArticles: deletedArticle.id } }, {$pull: {favouriteArticles: deletedArticle.id}});
      res.status(201).json({ message: "Success article deleted" });
    }else{
      res.status(400).json({ error: "You are not the author of this article and can't modify it." });
    }
  }catch(error){
    next(error);
  }
})

//favourite

router.post('/:slug/favourite', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  try{
    let favouritedArticle = await Article.findOneAndUpdate({ slug }, {$inc: {favouritesCount: 1}}, {new: true}).populate('author', '_id username bio image');
    let user = await User.findByIdAndUpdate(req.user.userId, { $push: {favouriteArticles: favouritedArticle.id } },{ new: true });
    res.status(201).json({ article: favouritedArticle.articleJSON(user.favouriteArticles, req.user.followers) });
  }catch(error){
    next(error);
  }
});

// unfavourite

router.delete('/:slug/favourite', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  try{
    let favouritedArticle = await Article.findOneAndUpdate({ slug }, {$inc: {favouritesCount: -1}}, {new: true}).populate('author', '_id username bio image');
    let user = await User.findByIdAndUpdate(req.user.userId, { $pull: {favouriteArticles: favouritedArticle.id } },{ new: true });
    res.status(201).json({ article: favouritedArticle.articleJSON(user.favouriteArticles, req.user.followers) });
  }catch(error){
    next(error);
  }
});


// comments


//Add a comment

router.post('/:slug/comments', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  req.body.author = req.user.userId;
  try{
    let article = await Article.findOne({ slug });
    req.body.article = article.id;
    let comment = await Comment.create(req.body);
    let user = await User.findById(req.user.userId);
    let populatedComment = await comment.populate("author", "username bio image following followers");
    return res.status(201).json({ comment: comment.commentJSON(user) });
  }catch(error){
    next(error);
  }
})

// get comments

router.get('/:slug/comments', auth.optionalVerify, async (req, res, next) => {
  let slug = req.params.slug;
  let commentArr = [];
  try{
    let article = await Article.findOne({ slug });
    let user = await User.findById(req.user.userId);
    let comments = await Comment.find({ article: mongoose.Types.ObjectId(article.id) }).populate("author", "username bio image following followers");
    comments.forEach(comment => {
      commentArr.push(comment.commentJSON(user));
    });
    res.status(201).json({ commentArr });
  }catch(error){
    next(error);
  }
});

// delete single comment

router.delete('/:slug/comments/:id', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  let id = req.params.id;
  try{
    let comment = await Comment.findById(id);
    if(comment.author.toString() === req.user.userId){
      let deletedComment = await Comment.findByIdAndDelete(id);
      res.status(201).json({ success: "comment deleted successfully" });
    }else{
      res.status(400).json({ error: "You are not the owner of the comment and can't delete it" });
    }
  }catch(error){
    next(error);
  }
})

module.exports = router;