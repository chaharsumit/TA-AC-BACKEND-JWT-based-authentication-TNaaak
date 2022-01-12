var express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');
const User = require('../models/User');
const Article = require('../models/Article');
const bcrypt = require('bcrypt');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/user', auth.verifyToken, async (req, res, next) => {
  try{
    let currentUser = await User.findById(req.user.userId);
    res.status(201).json({ user: currentUser.userJSON() });
  }catch(error){
    next(error);
  }
});

router.put('/user', auth.verifyToken, async (req, res, next) => {
  let id = req.user.userId;
  try{
    if(req.body.password){
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    let user = await User.findByIdAndUpdate(id, req.body, {new: true});
    return res.status(201).json({ user });
  }catch(error){
    next(error);
  }
});

router.get('/tags', async (req, res, next) => {
  try{
    let tags = await Article.find({}).distinct('tagList');
    return res.status(201).json({ tags });
  }catch(error){
    next(error);
  }
});

module.exports = router;