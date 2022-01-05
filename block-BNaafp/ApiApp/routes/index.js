var express = require('express');
var auth =  require('../middlewares/auth');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/protected', auth.verifyToken, (req, res, next) => {
  console.log(req.user);
  res.status(201).json({ access: "protected resource" });
})

module.exports = router;
