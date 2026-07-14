require("dotenv").config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/books', require('./routes/books'));

// Health check — useful to confirm server is up even if DB is down
app.get('/health', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    server: 'ok',
    db: dbState[mongoose.connection.readyState] ?? 'unknown',
  });
});

// ─── MongoDB connection ─────────────────────────────────────────────────────
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI is not set in .env");
  process.exit(1);
}
const MONGO_OPTS = {
  serverSelectionTimeoutMS: 30000,   // wait up to 30s to find a server
  socketTimeoutMS:          60000,   // how long a socket can be idle
  connectTimeoutMS:         30000,   // initial TCP connect timeout
  maxPoolSize:              10,
  retryWrites:              true,
};

async function connectWithRetry(attemptsLeft = 5) {
  try {
    await mongoose.connect(uri, MONGO_OPTS);
    console.log('🔥 MongoDB Connected Successfully');
  } catch (err) {
    console.error(`❌ MongoDB connection failed (${attemptsLeft} attempts left):`, err.message);

    if (attemptsLeft <= 1) {
      console.error('🛑 Could not connect to MongoDB. Exiting.');
      process.exit(1);
    }

    const delay = (6 - attemptsLeft) * 3000; // 3s, 6s, 9s, 12s back-off
    console.log(`⏳ Retrying in ${delay / 1000}s…`);
    setTimeout(() => connectWithRetry(attemptsLeft - 1), delay);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — reconnecting…');
  connectWithRetry(3);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

// ─── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

// Connect first, then start listening so routes never hit an unready DB
connectWithRetry().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});