const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/vehicles/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const uploadDirUser = path.join(__dirname, '../uploads/user/');
if (!fs.existsSync(uploadDirUser)) {
    fs.mkdirSync(uploadDirUser, { recursive: true });
}

const uploadDirReport = path.join(__dirname, '../uploads/report/');
if (!fs.existsSync(uploadDirReport)) {
    fs.mkdirSync(uploadDirReport, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/vehicles/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const storageUser = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/user/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const storageReport = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/report/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
    }
};

const vehicleDocumentUpload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const UserImageUpload = multer({ 
    storage: storageUser,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const UserReportImage = multer({ 
    storage: storageReport,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = {
    vehicleDocumentUpload,
    UserImageUpload,
    UserReportImage
};