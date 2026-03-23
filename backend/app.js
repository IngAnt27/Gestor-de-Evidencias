require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();

connectDB();

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/evidencias', require('./routes/evidenciaRoutes'));
app.use('/api/custodia', require('./routes/custodiaRoutes'));

app.use((err, req, res, next) => {
  res.status(500).json({ msg: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server en puerto ${PORT}`));