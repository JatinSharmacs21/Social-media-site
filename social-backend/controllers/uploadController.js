const cloudinary = require("../config/cloudinary");

const streamifier = require("streamifier");

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "social-app",
          },

          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);

    res.json({
      url: result.secure_url,

      type: result.resource_type === "video"
        ? "video"
        : "image",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  uploadMedia,
};