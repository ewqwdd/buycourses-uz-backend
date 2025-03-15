const adminMiddleware = (req, res, next) => {
  if (
    !req.isAuthenticated ||
    !req.isAuthenticated() ||
    req.user.role !== "admin"
  ) {
    return res.status(401).send({ message: "Not authenticated" });
  }
  next();
};

module.exports = adminMiddleware;
