const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { spawn } = require('child_process');
const Book = require('../models/Book');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });

router.post('/upload-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

    const pdfPath = req.file.path;
    const docxName = `${uuidv4()}.docx`;
    const docxPath = path.join('uploads', docxName);

    console.log('Converting PDF to DOCX...');

    const converter = spawn('python3', ['python/pdf_to_docx.py', pdfPath, docxPath]);

    let converterOutput = '';
    let converterError = '';

    converter.stdout.on('data', (data) => { converterOutput += data.toString(); });
    converter.stderr.on('data', (data) => { converterError += data.toString(); });

    converter.on('close', async (code) => {
      console.log('Converter output:', converterOutput);
      if (converterError) console.log('Converter warnings:', converterError);

      // Check SUCCESS even if there were warnings
      if (!converterOutput.includes('SUCCESS')) {
        return res.status(500).json({ error: 'PDF conversion failed' });
      }

      try {
        const userId = req.body.userId || '000000000000000000000001';
        const title = req.file.originalname.replace('.pdf', '');

        const newBook = new Book({
          userId,
          title,
          pdfUrl: pdfPath,
          docxUrl: `uploads/${docxName}`,
          status: 'ready',
          totalPages: 0,
          bookContent: []
        });

        await newBook.save();
        console.log('Book saved:', newBook._id);

        res.status(201).json({
          success: true,
          bookId: newBook._id,
          docxUrl: newBook.docxUrl,
          title: newBook.title
        });

      } catch (dbErr) {
        console.error('DB save error:', dbErr.message);
        res.status(500).json({ error: 'Failed to save book to database' });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const books = await Book.find({ userId: req.params.userId })
      .select('title createdAt docxUrl status')
      .sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

module.exports = router;