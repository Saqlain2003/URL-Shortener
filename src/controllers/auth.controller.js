import User from '../models/User.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';

export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await hashPassword(password);
    const user = await User.create({ email, password_hash });

    const token = generateToken(user._id);

    res.status(201).json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    req.log.error({ err: error }, 'Failed to create user');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    req.log.error({ err: error }, 'Failed to login user');
    res.status(500).json({ error: 'Internal server error' });
  }
};