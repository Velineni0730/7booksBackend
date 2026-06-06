const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/uploads', express.static('uploads'));

const uri = "mongodb+srv://bvarsh0730_db_user:123@cluster0.bojqgzz.mongodb.net/7books?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => console.log('🔥 MongoDB Connected Successfully'))
  .catch((err) => console.log('❌ MongoDB Connection Error: ', err));

app.use('/api/auth', require('./routes/auth')); 
app.use('/api/books', require('./routes/books'));

const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));