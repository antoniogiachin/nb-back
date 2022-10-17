const jwt = require("jsonwebtoken");

const authVerify = (req, res, next) => {
  // dagli header prendo il bearer token
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader.includes("Bearer")) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid auth header in request" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid Token! Request aborted!" });
    }

    //altrimenti provide al next email e roles
    req.email = decoded.UserInfo.username;
    req.roles = decoded.UserInfo.roles;
    next();
  });
};

module.exports = authVerify;
