// server/index.ts
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth'; // Adjust the path as necessary

const app = express();

// Middleware Setup
app.use(express.json()); // Must come before routes
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true,
}));

// Routes
app.use('/api', authRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

