const Tag = require("../models/Tag");
const asyncHandler = require("express-async-handler");


// @desc Get all tags
// @router GET /tags
// @access Public
const getAllTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find().populate("posts");

  if (!tags) {
    res.status(400).json({ success: false, message: "Error fetching tags!" });
  }

  res
    .status(200)
    .json({ success: true, message: "All tags fetched!", data: tags });
});

// @desc Get single tag
// @router GET /tags/:id
// @access Public
const getTag = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: "Please provide an ID!" });
  }

  const tag = await Tag.findById(id).populate("posts");

  if (!tag) {
    res.status(400).json({ success: false, message: "Error fetching tag!" });
  }

  res.status(200).json({
    success: true,
    message: `Tag ${tag.title} fetched successfully!`,
    data: tag,
  });
});

module.exports = { getAllTags, getTag };
