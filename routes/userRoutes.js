const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
// verifyAuth
const authVerify = require("../middleware/authVerify");

// multer
const multer = require("multer");

// profilepictures storage location
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "profilePictures");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      (new Date().toISOString() + file.originalname).replaceAll(" ", "")
    );
  },
});

// profile pictures type filter
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ["image/jpg", "image/jpeg", "image/png"];
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
  .get(usersController.getAllUsers)
  .post(upload.single("profilePicture"), usersController.createNewUser);

router
  .route("/:id")
  .put(authVerify, upload.single("profilePicture"), usersController.updateUser)
  .delete(authVerify, usersController.deleteUser);

module.exports = router;
