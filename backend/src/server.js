require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// ✅ Middleware
app.use(express.json()); // parse JSON request body
app.use(cors({
  origin: "http://localhost:4200", // allow Angular frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ✅ Connect to MongoDB
connectDB(process.env.MONGODB_URI); // pass the URI from .env

// ✅ Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Auth routes
app.use("/api/auth", require("./routes/auth"));

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
