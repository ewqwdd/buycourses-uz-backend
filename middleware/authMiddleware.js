const authMiddleware = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).send({ message: "Not authenticated" });
  }
  next();
};

module.exports = authMiddleware;