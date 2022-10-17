const Review = require("../models/Review");
// async handler
const asyncHandler = require("express-async-handler");

// @descGet all reviews
// @router GET /reviews
// @access Public
const getAllReviews = asyncHandler(async (req, res) => {
  // lean ci restituisce i dati e basta, e select con -pass indica di darci tutto tranne la password
  const reviews = await Review.find().populate("author").populate("answers");

  if (!reviews) {
    res.status(400).json({ success: false, message: " No reviews found!" });
  }

  res.json({ success: true, data: reviews, message: "All reviews fetched" });
});

// @desc write a review
// @router Post /reviews
// @access Private
const createNewReview = asyncHandler(async (req, res) => {
  const { title, content, author } = req.body;

  if (!title || !content || !author) {
    res.status(400).json({ success: false, message: " All fields required!" });
  }

  const reviewToStore = {
    title,
    content,
    author,
  };

  const review = await Review.create(reviewToStore);

  if (!review) {
    res.status(400).json({ success: false, message: "Error creating review!" });
  } else {
    res.status(400).json({
      success: true,
      message: "Review ${title} successfully created!",
      data: review,
    });
  }
});

// @desc Delete a review
// @router DELETE /review/:id
// @access Private (admin)
const deleteReview = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    res.status(400).json({ success: false, message: "Please provide an ID" });
  }

  if (!req.roles.includes("admin") || !req.roles.includes("Admin")) {
    res.status(400).json({ success: false, message: "Forbidden" });
  }

  const review = await Review.findById(id);
  if (!review) {
    res.status(400).json({ success: false, message: "Post not found!" });
  }
  const result = await review.deleteOne();

  if (!result) {
    res.status(400).json({ success: false, message: "Error deleting review!" });
  } else {
    res.status(200).json({
      success: true,
      message: `Review ${result.title} successfully deleted!`,
    });
  }
});

module.exports = { getAllReviews, createNewReview, deleteReview };
