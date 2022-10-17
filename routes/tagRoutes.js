const express = require("express");
const router = express.Router();
const tagsController = require("../controllers/tagsController");

// user route endpoint
router.route("/").get(tagsController.getAllTags);

router.route("/:id").get(tagsController.getTag);

module.exports = router;
