const userModel = require('../models/usermodel');
const { sendOtpEmail } = require('../services/email.service');
const OTP = require('../models/otpmodel');
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
            role: 'user',
            isVerified: false
        });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await OTP.create({ email, otp, action: 'account_verification' });

        try {
            await sendOtpEmail(email, otp, 'account_verification');
        } catch (emailError) {
            console.error('Failed to send OTP email during registration:', emailError.message);
            // Don't fail registration if email fails, but warn the user
            return res.status(201).json({
                message: 'User registered, but OTP email failed to send. Please contact support.',
                email: user.email,
                name: user.username,
                role: user.role,
                emailError: true
            });
        }

        res.status(201).json({
            message: 'User registered successfully. Please check your email for the OTP.',
            email: user.email,
            name: user.username,
            role: user.role
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

        if (!user.isVerified && user.role !== 'admin') {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await OTP.findOneAndDelete({ email: user.email, action: 'account_verification' });
            await OTP.create({ email: user.email, otp, action: 'account_verification' });

            try {
                await sendOtpEmail(user.email, otp, 'account_verification');
            } catch (emailError) {
                console.error('Failed to send OTP email during login:', emailError.message);
            }

            return res.status(403).json({
                message: 'Account not verified. A new OTP has been sent to your email.',
                needsVerification: true,
                email: user.email
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

async function verifyOtp(req, res) {
    try {
        const { email, otp } = req.body;

        const otpRecord = await OTP.findOne({
            email,
            otp,
            action: 'account_verification'
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const user = await userModel.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        );

        await OTP.deleteMany({ email, action: 'account_verification' });

        res.json({
            message: 'Account verified successfully. You can now login.',
            _id: user._id,
            name: user.username,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error('OTP verification error:', error.message);
        res.status(500).json({ message: 'OTP verification failed', error: error.message });
    }
}

module.exports = {
    registerUser,
    loginUser,
    verifyOtp
};