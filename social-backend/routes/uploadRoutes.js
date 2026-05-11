const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const {
  uploadMedia,
} = require("../controllers/uploadController");

// UPLOAD IMAGE / VIDEO
router.post(
  "/",
  protect,
  upload.single("file"),
  uploadMedia
);

module.exports = router;