const jwt = require('jsonwebtoken');

module.exports = {
  verifyToken: async (req, res, next) => {
    let token = req.headers.authorization;
    try{
      if(token){
        let payload = jwt.verify(token, "secretvaluehere");
        req.user = payload;
        next();
      }else{
        res.status(400).json({ error: "Token required for access!!" });
      }
    }catch(error){
      next(error);
    }
  }
}