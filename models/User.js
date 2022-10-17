const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    profilePicture: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    // uno o piu' ruoli
    roles: [
      {
        type: String,
        default: "User",
        required: false,
      },
    ],
    isAuthor: {
      type: Boolean,
      default: false,
      required: false,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
