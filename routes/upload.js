const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure storage logic
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage: storage });

/**
 * POST / - Handle single file upload
 * Converted to async/await for better integration with other services
 */
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // You can now easily add async logic here, such as:
    // await db.Image.create({ path: req.file.filename });

    res.json({ 
      filename: req.file.filename, 
      url: '/uploads/' + req.file.filename 
    });
  } catch (error) {
    // Catch any unexpected errors during the process
    res.status(500).json({ error: 'Internal Server Error during upload' });
  }
});

module.exports = router;
