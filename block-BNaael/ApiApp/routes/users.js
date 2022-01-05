var express = require('express');
var User = require('../models/User');
var auth = require('../middlewares/auth');
var router = express.Router();

/* GET users listing. */
router.get('/', auth.verifyToken, function(req, res, next) {
  res.json({access: "Access Granted"});
});

router.post('/register', async (req, res, next) => {
  try{
    let user = await User.create(req.body);
    let token = await user.signToken();
    res.status(201).json({ user: user.userJSON(token) });
  }catch(error){
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  let { email, password } = req.body;
  if(!email || !password){
    return res.status(400).json({ error: "Email/Password required" });
  }
  try{
    let user = await User.findOne({ email });
    if(!user){
      return res.status(400).json({ error : "User not found" });
    }
    let result = await user.verifyPassword(password);
    if(!result){
      return res.status(400).json({ error: "Incorrect Password!!" });
    }
    let token = await user.signToken();
    res.status(201).json({ user: user.userJSON(token) });
  }catch(error){
    next(error);
  }
});

module.exports = router;