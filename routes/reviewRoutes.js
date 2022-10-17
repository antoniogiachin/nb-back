const express = require("express");
const router = express.Router();
const reviewsController = require("../controllers/reviewsController");
// verifyAuth
const authVerify = require("../middleware/authVerify");

router
  .route("/")
  .get(reviewsController.getAllReviews)
  .post(authVerify, reviewsController.createNewReview);

router.route("/:id").delete(authVerify, reviewsController.deleteReview);

module.exports = router;
