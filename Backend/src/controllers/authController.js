const userModel = require('../models/usermodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function registerUser(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Please provide name, email and password'
            });
        }

        const existingUser = await userModel.findOne({
            $or: [{ username: name }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'Account already exists with this email address or name'
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username: name,
            email,
            password: hash,
            role: 'user'
        });

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'User registered successfully.',
            _id: user._id,
            email: user.email,
            name: user.username,
            role: user.role,
            token
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            _id: user._id,
            name: user.username,
            email: user.email,
            role: user.role,
            token
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
}

module.exports = {
    registerUser,
    loginUser
};
