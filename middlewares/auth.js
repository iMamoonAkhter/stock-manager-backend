const jwt = require('jsonwebtoken');
const config = require('config');
const Users = require('../models/users');
async function auth(req,res,next)
{
    let token= req.header('x-auth-token');
    if(!token) return res.status(400).send('Please sign in to continue');
  
    let user = jwt.verify(token,env.process.JWT_PRIVATE_KEY);
    
    req.user= user;      
    next();
}
module.exports=auth;