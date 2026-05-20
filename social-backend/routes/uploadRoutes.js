const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const { upload, validateFileSize } = require("../middleware/uploadMiddleware");

const {
  uploadMedia,
} = require("../controllers/uploadController");

// UPLOAD IMAGE / VIDEO
router.post("/", protect, upload.single("file"), validateFileSize, uploadMedia);

router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large. Max size is 60MB.",
    });
  }

  return res.status(400).json({
    message: err.message || "Upload failed",
  });
});

module.exports = router;