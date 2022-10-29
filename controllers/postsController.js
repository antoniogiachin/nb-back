const Post = require("../models/Post");
const User = require("../models/User");
const Tag = require("../models/Tag");
// async handler
const asyncHandler = require("express-async-handler");
// fs for remove file
const fs = require("fs");
const path = require("path");

// @desc Get all posts
// @router GET /posts
// @access Public
const getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find(req.query).populate("author").populate("tags");

  if (!posts) {
    res.status(400).json({ success: false, message: "Error fetching posts!" });
  }

  res
    .status(200)
    .json({ success: true, message: "All posts fetched!", data: posts });
});

// @desc Get all user posts
// @router GET /posts
// @access Public
const getAllUserPosts = asyncHandler(async (req, res) => {
  const email = req.params.email;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400).json({ success: false, message: "Error fetching user!" });
  }

  const posts = await Post.findOne({ author: user._id })
    .populate("reviews")
    .populate("tags");

  if (!posts) {
    res.status(400).json({ success: false, message: "Error fetching posts!" });
  }

  res
    .status(200)
    .json({ success: true, message: "All user posts fetched!", data: posts });
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
  const { title, content, tags } = req.body;
  const { roles, email } = req;

  let postMediaPaths = [];
  if (req.files) {
    for (const file of req.files) {
      let postMediaFilesDir = `postMediaFilesPath/${
        file.originalname.split("-")[0]
      }`;
      postMediaPaths.push(
        __dirname,
        "..",
        postMediaFilesDir,
        file.path.split("/")[1]
      );
    }
  }

  if (req.files && req.files.length > 3) {
    for (const path of postMediaPaths) {
      fs.unlink(path, (err) => {
        if (err) console.log(err);
      });
    }

    return res.status(400).json({
      success: false,
      message: "Max 3 files for post!",
    });
  }

  //  delete img se errore
  // for (const path of postMediaPaths) {
  //   fs.unlink(path, (err) => {
  //     if (err) console.log(err);
  //   });
  // }

  if (!title || !content || !tags) {
    for (const path of postMediaPaths) {
      fs.unlink(path, (err) => {
        if (err) console.log(err);
      });
    }

    return res.status(400).json({
      success: false,
      message: "All fields Required!",
    });
  }

  if (!roles.includes("Author") && !roles.includes("author")) {
    for (const path of postMediaPaths) {
      fs.unlink(path, (err) => {
        if (err) console.log(err);
      });
    }

    return res.status(400).json({
      success: false,
      message: "You're not an author, can't proceed creating post!",
    });
  }

  const author = await User.findOne({ email });

  if (!author) {
    for (const path of postMediaPaths) {
      fs.unlink(path, (err) => {
        if (err) console.log(err);
      });
    }

    return res.status(400).json({
      success: false,
      message: "No author with given email found!",
    });
  }

  // // slug
  const slug = `${title}-${author.username}-${new Date()
    .toISOString()
    .replaceAll(".", "-")}`;

  let tagsId = [];
  for (const tag of tags.split(",")) {
    const { _id } = await Tag.findOne({ name: tag });
    tagsId.push(_id);
  }

  const postToStore = {
    title,
    content,
    slug,
    tags: [...tagsId],
    author: author._id,
  };

  if (req.files) {
    let media = [];
    for (const file of req.files) {
      media.push(file.path);
    }
    postToStore.media = media;
  }

  const post = await Post.create(postToStore);

  if (!post) {
    for (const path of postMediaPaths) {
      fs.unlink(path, (err) => {
        if (err) console.log(err);
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Error creating post!" });
  }

  author.posts.push(post._id);

  const updatedAuthor = await author.save();

  for (const tag of tags.split(",")) {
    const res = await Tag.findOne({ name: tag });
    res.posts.push(post._id);
    await res.save();
  }

  if (!updatedAuthor) {
    for (const path of postMediaPaths) {
      fs.unlink(path, (err) => {
        if (err) console.log(err);
      });
    }

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
const updatePost = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (
    (req.body.author && !req.body.roles.includes("GOD")) ||
    (req.body.reviews && !req.body.roles.includes("GOD"))
  ) {
    return res
      .status(400)
      .json({ message: "Hacking attampt please fuck off!", success: false });
  }

  if (!id) {
    res.status(400).json({ success: false, message: "Please provide an ID" });
  }

  if (!req.roles.includes("author") || !req.roles.includes("Author")) {
    res.status(400).json({ success: false, message: "Forbidden" });
  }

  const post = await Post.findById(id).populate("author");

  if (!post) {
    res.status(400).json({ success: false, message: "Post not found!" });
  }

  if (post.author.email !== req.email) {
    res.status(400).json({ success: false, message: "Forbidden!" });
  }

  // slug
  if (req.body.title && post.title !== req.body.title) {
    const slug = `${req.body.title}-${
      post.author.username
    }-${new Date().toISOString()}`;

    post.slug = slug;
  }

  for (const [key, value] of Object.entries(req.body)) {
    post[key] = value;
    if (key === "tags") {
      for (const tag of value) {
        post[key].push(tag);
      }
    }
  }

  const updatedPost = await post.save();

  if (!updatedPost) {
    res.status(400).json({ success: false, message: "Post not found!" });
  } else {
    res.status(201).json({
      success: true,
      data: updatedPost,
      message: `Success update ${updatedPost.title}!`,
    });
  }
});

// @desc Delete a posts
// @router DELETE /posts/:id
// @access Private
const deletePost = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    res.status(400).json({ success: false, message: "Please provide an ID" });
  }

  if (!req.roles.includes("author") || !req.roles.includes("Author")) {
    res.status(400).json({ success: false, message: "Forbidden" });
  }

  const post = await Post.findById(id).populate("author");

  if (!post) {
    res.status(400).json({ success: false, message: "Post not found!" });
  }

  if (post.author.email !== req.email) {
    res.status(400).json({ success: false, message: "Forbidden!" });
  }

  const result = await post.deleteOne();

  if (!result) {
    res.status(400).json({ success: false, message: "Error deleting post!" });
  } else {
    res.status(200).json({
      success: true,
      message: `User ${result.title} successfully deleted!`,
    });
  }
});

module.exports = {
  getAllPosts,
  getPost,
  getAllUserPosts,
  createNewPost,
  updatePost,
  deletePost,
};
