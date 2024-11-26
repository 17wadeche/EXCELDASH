// server/routes/auth.ts
import express, { Request, Response } from 'express';
import User from '../models/User'; // Adjust the path as necessary
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';

dotenv.config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'f7fae5e883fcdc04e9fa409c75dae00e166bc1d0aca05e40b5bddbf110c76a7b';

// Middleware for validating email
const validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.'),
];

// Login Endpoint (Email-only, Passwordless)
router.post('/login', validateEmail, async (req: Request, res: Response) => {
  console.log('Received /api/login request');
  console.log('Request Body:', req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    console.log('User found:', user);

    if (!user) {
      // Create a new user if not exists
      user = new User({ email });
      await user.save();
      console.log('Created new user:', user);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' } // Token valid for 1 hour
    );
    console.log('Generated Token:', token);

    // Respond with user and token
    res.json({
      message: 'Logged in successfully.',
      user: {
        id: user._id,
        email: user.email,
        // Include other user fields as needed
      },
      token,
    });

    console.log('Login Successful. User:', user.email);
    console.log('Generated Token:', token);
  } catch (error) {
    console.error('Login/Error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

export default router;
