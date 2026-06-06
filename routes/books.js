const express = require('express');
const router = express.Router();

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { spawn } = require('child_process');

const Book = require('../models/Book');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },

  filename: (req, file, cb) => {
    cb(
      null,
      `${uuidv4()}${path.extname(file.originalname)}`
    );
  }
});

const upload = multer({ storage });

router.post('/upload-pdf', upload.single('pdfFile'), async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({
        error: 'No PDF uploaded'
      });
    }

    const python = spawn('python3', [
      'python/extractor.py',
      req.file.path
    ]);

    let result = '';
    let error = '';

    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', async () => {

      if (error) {

        console.error(error);

        return res.status(500).json({
          error: 'Python extraction failed'
        });

      }

      let extracted;

      try {

        extracted = JSON.parse(result);

      } catch (parseError) {

        console.error('Python Output:', result);

        return res.status(500).json({
          error: 'Invalid JSON returned from extractor'
        });

      }

      const bookContent = [];

      extracted.pages.forEach(page => {

        page.blocks.forEach(block => {

          bookContent.push({

            type: block.type,

            content: block.text || '',

            pageNumber: page.pageNumber,

            fontSize: block.fontSize || 0,

            wordCount: block.wordCount || 0,

            yPosition: block.y || 0,

            xPosition: block.x || 0,

            width: block.width || 0

          });

        });

      });

      console.log(
        'Pages:',
        extracted.totalPages,
        'Blocks:',
        bookContent.length
      );

      const newBook = new Book({

        userId:
          req.body.userId ||
          '6a13f2fcbe44e159961f27b2',

        title:
          req.file.originalname.replace('.pdf', ''),

        pdfUrl: req.file.path,

        totalPages: extracted.totalPages,

        status: 'ready',

        bookContent

      });

      await newBook.save();

      console.log('Saved Book:', newBook._id);

      res.status(201).json({

        success: true,

        bookId: newBook._id,

        pages: extracted.totalPages,

        pdfUrl: newBook.pdfUrl

      });

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Upload failed'
    });

  }

});

router.get('/:id', async (req, res) => {

  try {

    const book = await Book.findById(req.params.id);

    if (!book) {

      return res.status(404).json({
        error: 'Book not found'
      });

    }

    res.json(book);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Failed to fetch book'
    });

  }

});

module.exports = router;