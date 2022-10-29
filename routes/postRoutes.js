const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
// verifyAuth
const authVerify = require("../middleware/authVerify");

// multer
const multer = require("multer");

// fs & path
const fs = require("fs");
const path = require("path");

// posts storage location (max 3 files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // let postMediaFilesPath = path.join(__dirname, "..", "postMediaFilesPath");
    let postMediaFilesDir = `postMediaFilesPath/${
      file.originalname.split("-")[0]
    }`;
    if (!fs.existsSync(postMediaFilesDir)) {
      fs.mkdirSync(postMediaFilesDir);
    }
    cb(null, postMediaFilesDir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      (
        new Date().toISOString() +
        file.originalname +
        "." +
        file.mimetype.split("/")[1]
      ).replaceAll(" ", "")
    );
  },
});

// profile pictures type filter
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = [
    "image/jpg",
    "image/jpeg",
    "image/png",
    "video/mp4",
  ];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage, fileFilter });

// user route endpoint
router
  .route("/")
  .get(postsController.getAllPosts)
  .post(upload.any(), authVerify, postsController.createNewPost);

router
  .route("/:id")
  .get(postsController.getPost)
  .put(authVerify, postsController.updatePost)
  .delete(authVerify, postsController.deletePost);

router.route("/user/:email").get(authVerify, postsController.getAllUserPosts);

module.exports = router;
