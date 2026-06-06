const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  title: {
    type: String,
    required: true,
    default: 'Untitled E-Book'
  },

  coverImage: {
    type: String,
    default: null
  },

  pdfUrl: {
    type: String,
    default: null
  },

  bookContent: [
    {
      type: {
        type: String,
        enum: [
          'cover',
          'title',
          'toc',
          'chapter',
          'heading',
          'subheading',
          'paragraph',
          'quote',
          'list',
          'image',
          'table',
          'header',
          'footer',
          'metadata',
          'pageNumber'
        ],
        default: 'paragraph'
      },

      content: {
        type: String,
        default: ''
      },

      pageNumber: {
        type: Number,
        required: true
      },

      imageUrl: {
        type: String,
        default: null
      },

      fontSize: {
        type: Number,
        default: 0
      },

      wordCount: {
        type: Number,
        default: 0
      },

      yPosition: {
        type: Number,
        default: 0
      },

      xPosition: {
        type: Number,
        default: 0
      },

      width: {
        type: Number,
        default: 0
      }
    }
  ],

  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing'
  },

  totalPages: {
    type: Number,
    default: 0
  },

  lastOpenedPage: {
    type: Number,
    default: 1
  },

  preferences: {
    zoomLevel: {
      type: Number,
      default: 1
    },

    layoutMode: {
      type: String,
      default: 'double'
    },

    fontFamily: {
      type: String,
      default: 'Switzer'
    },

    fontSize: {
      type: Number,
      default: 16
    },

    lineHeight: {
      type: Number,
      default: 1.6
    },

    textAlign: {
      type: String,
      default: 'left'
    },

    pageMargin: {
      type: Number,
      default: 48
    },

    bgColor: {
      type: String,
      default: '#ffffff'
    },

    textColor: {
      type: String,
      default: '#111827'
    }
  },

  bookmarks: [
    {
      type: Number
    }
  ]

}, {
  timestamps: true
});

module.exports = mongoose.model('Book', bookSchema);