const User = require("../models/User");
const Post = require("../models/Post");
// async handler
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
// fs for remove file
const fs = require("fs");
const path = require("path");

// @Get all users
// @router GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  // lean ci restituisce i dati e basta, e select con -pass indica di darci tutto tranne la password
  const users = await User.find().select("-password").lean();

  if (!users) {
    res.status(400).json({ success: false, message: " No users found!" });
  }

  res.json({ success: true, data: users });
});

// @desc Create new user
// @router POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { name, surname, username, email, password, birthDate, isAuthor } =
    req.body;

  console.log(req.file.path);
  // path per eliminazione in caso di errore
  const profilePicturesPath = path.join(
    __dirname,
    "..",
    "profilePictures",
    req.file.path.split("/")[1]
  );
  //  delete img se errore
  // fs.unlink(profilePicturesPath, (err) => {
  //   if (err) console.log(err);
  // });

  if (
    !name ||
    !surname ||
    !username ||
    !email ||
    !birthDate ||
    (isAuthor && typeof isAuthor !== "boolean") ||
    password.length < 6
  ) {
    fs.unlink(profilePicturesPath, (err) => {
      if (err) console.log(err);
    });
    res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  // check for duplicates
  const userDuplicate = await User.findOne({ username }).lean();
  console.log(userDuplicate);
  if (userDuplicate) {
    fs.unlink(profilePicturesPath, (err) => {
      if (err) console.log(err);
    });
    return res.status(409).json("Username already taken");
  }
  const emailDuplicate = await User.findOne({ email }).lean();
  if (emailDuplicate) {
    fs.unlink(profilePicturesPath, (err) => {
      if (err) console.log(err);
    });
    return res.status(409).json("Email already taken");
  }

  // Check for Roles
  const roles = ["User"];
  if (isAuthor) {
    roles.push("Author");
  }

  // Hash PWD
  const hashedPwd = await bcrypt.hash(password, 10);

  const userToStore = {
    name,
    surname,
    email,
    username,
    birthDate,
    isAuthor,
    roles,
    slug: `username.${new Date().toISOString()}`,
    password: hashedPwd,
    profilePicture: req.file.path,
  };

  // create e store user
  const user = await User.create(userToStore);

  if (user) {
    res
      .status(201)
      .json({ success: true, data: user, message: `New ${username} created` });
  } else {
    fs.unlink(profilePicturesPath, (err) => {
      if (err) console.log(err);
    });
    res
      .status(400)
      .json({ success: false, message: `Error creating ${username}` });
  }
});

// @desc Update a user
// @router PUT /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (req.file) {
    // path per eliminazione in caso di errore
    const profilePicturesPath = path.join(
      __dirname,
      "..",
      "profilePictures",
      req.file.path.split("/")[1]
    );
  }

  if (
    req.body.name ||
    req.body.surname ||
    req.body.username ||
    req.body.birthDate ||
    req.body.posts ||
    req.body.slug ||
    req.body.roles.includes("GOD")
  ) {
    fs.unlink(profilePicturesPath, (err) => {
      if (err) console.log(err);
    });
    return res
      .status(400)
      .json({ message: "Hacking attampt please fuck off!", success: false });
  }

  if (!id) {
    fs.unlink(profilePicturesPath, (err) => {
      if (err) console.log(err);
    });
    res.status(400).json({ success: false, message: "Please provide an ID" });
  }

  const user = await User.findById(id);

  if (!user) {
    fs.unlink(profilePicturesPath, (err) => {
      if (err) console.log(err);
    });
    res.status(400).json({ success: false, message: "User not found!" });
  }

  if (user.email !== req.email) {
    fs.unlink(profilePicturesPath, (err) => {
      if (err) console.log(err);
    });
    res.status(400).json({ success: false, message: "Forbidden!" });
  }

  if (req.file) {
    fs.unlink(user.profilePicture.split("/")[1], (err) => {
      if (err) console.log(err);
    });
  }

  for (const [key, value] of Object.entries(req.body)) {
    if (key === "password") {
      user[password] = bcrypt.hash(value, 10);
    } else if (key === "roles") {
      const roleSet = new Set([...user[key]]);
      for (const role of value) {
        roleSet.add(role);
        user[key] = Array.from(roleSet);
      }

      if (value.includes("author") || value.includes("Author")) {
        console.log();
        user.isAuthor = true;
      }
    } else if (key === "profilePicture") {
      user.profilePicture = req.file.path;
    } else {
      user[key] = value;
    }
  }

  const updatedUser = await user.save();

  if (!updateUser) {
    fs.unlink(profilePicturesPath, (err) => {
      if (err) console.log(err);
    });
    res.status(400).json({ success: false, message: "User not found!" });
  } else {
    res.status(201).json({
      success: true,
      data: updatedUser,
      message: `Success update ${updatedUser.username}!`,
    });
  }
});

// @desc Delete a user
// @router DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { deleteAllPosts } = req.body;

  if (!id) {
    res.status(400).json({ success: false, message: "Please provide an ID" });
  }

  const user = await User.findById(id);

  if (!user) {
    res.status(400).json({ success: false, message: "User not found!" });
  }

  if (user.email !== req.email) {
    res.status(400).json({ success: false, message: "Forbidden!" });
  }

  if (user.posts.length && deleteAllPosts) {
    for (const post of user.posts) {
      const postToDelete = await Post.findByIdAndDelete(post);
      if (!postToDelete) {
        res
          .status(400)
          .json({ success: false, message: "Error deleting post" });
      }
    }
  }

  const result = await user.deleteOne();

  if (!result) {
    res.status(400).json({ success: false, message: "Error deleting user!" });
  } else {
    if (user.profilePicture) {
      fs.unlink(user.profilePicture.split("/")[1], (err) => {
        if (err) console.log(err);
      });
    }
    res.status(200).json({
      success: true,
      message: `User ${result.username} successfully deleted!`,
    });
  }
});

module.exports = { getAllUsers, createNewUser, updateUser, deleteUser };
