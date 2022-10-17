const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
// verifyAuth
const authVerify = require("../middleware/authVerify");

// user route endpoint
router
  .route("/")
  .get(postsController.getAllPosts)
  .post(authVerify, postsController.createNewPost);

router
  .route("/:id")
  .get(postsController.getPost)
  .put(authVerify, postsController.updatePost)
  .delete(authVerify, postsController.deletePost);

module.exports = router;
