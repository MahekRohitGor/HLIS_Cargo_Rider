const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

// Multer upload configurations
const upload = multer({ storage });

//  Single File Upload API
app.post("/upload-single", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    res.json({
        message: "Single file uploaded successfully",
        file: req.file
    });
});

// Multiple File Upload API (Max: 5 Files)
app.post("/upload-multiple", upload.array("files", 5), (req, res) => {
    if (!req.files || req.files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });

    res.json({
        message: "Multiple files uploaded successfully",
        files: req.files
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
