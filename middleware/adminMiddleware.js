const adminMiddleware = (req, res, next) => {
  if (
    !req.isAuthenticated ||
    !req.isAuthenticated() ||
    !req.user.email.includes("chul.com")
  ) {
    return res.status(401).send({ message: "Access denied" });
  }
  next();
};

module.exports = adminMiddleware;
