const jwt = require('jsonwebtoken');

module.exports = {
  verifyToken: async (req, res, next) => {
    let token = req.headers.authorization;
    try{
      if(token){
        let payload = await jwt.verify(token, "secretvalue");
        req.user = payload;
        next();
      }else{
        res.status(400).json({ error: "Token required" });
      }
    }catch(error){
      next(error);
    }
  }
}