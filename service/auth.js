const jwt = require("jsonwebtoken");

const verifyUser = (req, res, next) => {
  const token = req.cookies.accesstoken;

  if (!token) return res.status(401).send("Access denied");

  try {
    const decoded = jwt.verify(token, "access_key");
    req.user = decoded;   
    next();
  } catch (err) {
    return res.status(403).send("Invalid token");
  }
};

const verifyAdmin = (req, res, next) => {
  const token = req.cookies.accesstoken;

  if (!token) return res.status(401).send("Access denied");

  try {
    const decoded = jwt.verify(token, "access_key");

    if (decoded.role !== "admin") {
      return res.status(403).send("Only admin allowed");
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).send("Invalid token");
  }
};

const verifyAccessToken = (req,res,next)=>{

  const token = req.cookies.accesstoken;

  if(!token){
    return res.redirect("/login");
  }

  try{

    const decoded = jwt.verify(token,"access_key");
    req.user = decoded;

    next();

  }
  catch(err){

    if(err.name === "TokenExpiredError"){
      return res.redirect("/refresh");
    }

    return res.redirect("/login");
  }

}

module.exports = { verifyUser, verifyAdmin, verifyAccessToken };