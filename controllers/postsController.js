const Post = require("../models/Post");
const User = require("../models/User");
// async handler
const asyncHandler = require("express-async-handler");

// @desc Get all posts
// @router GET /posts
// @access Public
const getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find().populate("author").populate("tags");

  if (!posts) {
    res.status(400).json({ success: false, message: "Error fetching posts!" });
  }

  res
    .status(200)
    .json({ success: true, message: "All posts fetched!", data: posts });
});

// @desc Get single post
// @router GET /posts/:id
// @access Public
const getPost = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: "Please provide an ID!" });
  }

  const post = await Post.findById(id)
    .populate("author")
    .populate("tags")
    .populate("reviews");

  if (!post) {
    res.status(400).json({ success: false, message: "Error fetching post!" });
  }

  res.status(200).json({
    success: true,
    message: `Post ${post.title} fetched successfully!`,
    data: post,
  });
});

// @desc Create a post
// @router POST /posts
// @access Private
const createNewPost = asyncHandler(async (req, res) => {
  const { title, content, tags, roles, email } = req.body;

  if (!title || !content || !Array.isArray(tags)) {
    return res.status(400).json({
      success: false,
      message: "All fields Required!",
    });
  }

  if (!roles.includes("author")) {
    return res.status(400).json({
      success: false,
      message: "You're not an author, can't proceed creating post!",
    });
  }

  const author = await User.findOne({ email });

  if (!author) {
    return res.status(400).json({
      success: false,
      message: "No author with given email found!",
    });
  }

  // slug
  const slug = `${title}-${author.username}-${new Date().toISOString()}`;

  const postToStore = {
    title,
    content,
    slug,
    tags,
    author: author._id,
  };

  const post = await Post.create(postToStore);

  if (!post) {
    return res
      .status(400)
      .json({ success: false, message: "Error creating post!" });
  }

  author.posts.push(post._id);

  const updatedAuthor = await User.save();

  if (!updatedAuthor) {
    res.status(400).json({ success: false, message: "Error updating author!" });
  } else {
    res.status(200).json({
      success: true,
      data: post,
      author: updatedAuthor,
      message: `Post ${title} successfully created!`,
    });
  }
});

// @desc Edit a posts
// @router PUT /posts/:id
// @access Private
const editPost = asyncHandler(async (req, res) => {});

// @desc Delete a posts
// @router DELETE /posts/:id
// @access Private
const deletePost = asyncHandler(async (req, res) => {});

module.exports = { getAllPosts, getPost };
