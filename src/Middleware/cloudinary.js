const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Test Cloudinary config
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error("Cloudinary config error:", error);
  } else {
    console.log("Cloudinary connected successfully:", result);
  }
});
// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ORC-bill", // Folder in Cloudinary
    allowed_formats: ["jpg", "png"], // Restrict to images for OCR
    resource_type: "image", // Use 'image' since OCR works with images
  },
});

// Initialize Multer with Cloudinary storage
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(file.originalname.toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extname && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, JPG, and PNG are allowed."));
    }
  },
});

// Middleware for single image upload (since OCR typically processes one image)
const uploadSingle = upload.single("image");

module.exports = { uploadSingle }; // Export the single upload middleware