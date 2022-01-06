const jwt = require('jsonwebtoken');

module.exports = {
  verifyToken: async (req, res, next) => {
    let token = req.headers.authorization;
    try{
      if(token){
        let payload = await jwt.verify(token, "thisisasecretstring");
        req.user = payload;
        next();
      }else{
        res.status(400).json({error: "Token Required"});
      }
    }catch(error){
      next(error);
    }
  }
}