const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');

const userSchema = new Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timeStamps: true });

userSchema.pre("save", async function(next){
  if(this.password && this.isModified("password")){
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
})

userSchema.methods.verifyPassword = async function(password){
  try{
    let result = await bcrypt.compare(password, this.password);
    return result;
  }catch(error){
    return error;
  }
} 

userSchema.methods.signToken = async function(){
  let payload = { userId: this.id };
  try{
    let token = await jwt.sign(payload, "secretvalue");
    return token;
  }catch(error){
    return error;
  }
}

userSchema.methods.userJSON = function(token){
  return {
    name: this.name,
    email: this.email,
    token: token
  }
}


const User = mongoose.model("User", userSchema);

module.exports = User;