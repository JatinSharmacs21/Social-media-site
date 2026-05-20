const multer = require("multer");

const storage = multer.memoryStorage();

const imageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const videoMimeTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const upload = multer({
  storage,
  limits: {
    fileSize: 60 * 1024 * 1024, // multer max 60MB, custom check below
  },
  fileFilter: (req, file, cb) => {
    const isImage = imageMimeTypes.includes(file.mimetype);
    const isVideo = videoMimeTypes.includes(file.mimetype);

    if (!isImage && !isVideo) {
      return cb(new Error("Only image and video files are allowed"));
    }

    cb(null, true);
  },
});

const validateFileSize = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const isImage = imageMimeTypes.includes(req.file.mimetype);
  const isVideo = videoMimeTypes.includes(req.file.mimetype);

  const imageLimit = 10 * 1024 * 1024; // 10MB
  const videoLimit = 60 * 1024 * 1024; // 60MB

  if (isImage && req.file.size > imageLimit) {
    return res.status(400).json({ message: "Image too large. Max size is 10MB." });
  }

  if (isVideo && req.file.size > videoLimit) {
    return res.status(400).json({ message: "Video too large. Max size is 60MB." });
  }

  next();
};

module.exports = {
  upload,
  validateFileSize,
};