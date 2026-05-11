const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.send("No token, access denied");
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    req.user = verified;

    next(); // next step pe bhej do
  } catch (error) {
    res.send("Invalid token");
  }
};

module.exports = authMiddleware;