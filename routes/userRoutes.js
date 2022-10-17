const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
// verifyAuth
const authVerify = require("../middleware/authVerify");

// user route endpoint
router
  .route("/")
  .get(usersController.getAllUsers)
  .post(usersController.createNewUser);

router
  .route("/:id")
  .put(authVerify, usersController.updateUser)
  .delete(authVerify, usersController.deleteUser);

module.exports = router;
