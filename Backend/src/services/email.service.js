const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const transporter = emailUser && emailPass
    ? nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        family: 4,
        auth: {
            user: emailUser,
            pass: emailPass
        }
    })
    : null;

if (transporter) {
    transporter.verify((error, success) => {
        if (error) {
            console.error('Error connecting to email server:', error);
        } else {
            console.log('Email server is ready to send messages');
        }
    });
} else {
    console.warn('Email credentials not found in environment variables. OTP emails will be disabled.');
}

async function sendOtpEmail(email, otp, type) {
    try {
        if (!transporter) {
            throw new Error('Email credentials are not configured.');
        }

        const title = type === 'account_verification' ? 'Verify your Eventora Account' : 'Eventora Booking Verification';
        const msg = type === 'account_verification'
            ? 'Please use the following OTP to verify your new Eventora account.'
            : 'Please use the following OTP to verify and confirm your event booking.';

        const mailOptions = {
            from: emailUser,
            to: email,
            subject: title,
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #111;">${title}</h2>
                    <p style="color: #555; font-size: 16px;">${msg}</p>
                    <div style="margin: 20px auto; padding: 15px; font-size: 24px; font-weight: bold; background: #f4f4f4; width: max-content; letter-spacing: 5px;">
                        ${otp}
                    </div>
                    <p style="color: #999; font-size: 12px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email} for ${type}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw error; // Rethrow so the caller (bookingController) can return a proper error to the frontend
    }
}

async function sendBookingEmail(userEmail, userName, eventTitle) {
    try {
        if (!transporter) {
            throw new Error('Email credentials are not configured.');
        }

        const mailOptions = {
            from: emailUser,
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `
                <h2>Hi ${userName}!</h2>
                <p>Your booking for the event <strong>${eventTitle}</strong> is successfully confirmed.</p>
                <p>Thank you for choosing Eventora.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to', userEmail);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = {
    sendOtpEmail,
    sendOTPEmail: sendOtpEmail,
    sendBookingEmail
};