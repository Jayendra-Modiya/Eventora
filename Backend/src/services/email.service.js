const nodemailer = require('nodemailer');

function createTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) return null;

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,  // use STARTTLS (port 587) — Render free tier blocks port 465
        requireTLS: true,
        family: 4,      // Force IPv4
        auth: {
            user: emailUser,
            pass: emailPass
        },
        connectionTimeout: 15000,
        socketTimeout: 15000
    });
}

function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

async function sendEmail({ to, subject, html }) {
    const emailUser = process.env.EMAIL_USER;
    const transporter = createTransporter();

    if (!transporter) {
        throw new Error('Email service is not configured. Set EMAIL_USER and EMAIL_PASS in the backend environment.');
    }

    await transporter.sendMail({
        from: `Eventora <${emailUser}>`,
        to,
        subject,
        html
    });
}

async function sendOtpEmail(email, otp, type) {
    const isAccountVerification = type === 'account_verification';
    const title = isAccountVerification ? 'Verify your Eventora Account' : 'Eventora Booking Verification';
    const message = isAccountVerification
        ? 'Use this code to verify your Eventora account.'
        : 'Use this code to verify and confirm your event booking.';

    await sendEmail({
        to: email,
        subject: title,
        html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                <h2 style="color: #111;">${title}</h2>
                <p style="color: #555; font-size: 16px;">${message}</p>
                <div style="margin: 20px auto; padding: 15px; font-size: 24px; font-weight: bold; background: #f4f4f4; width: max-content; letter-spacing: 5px;">
                    ${escapeHtml(otp)}
                </div>
                <p style="color: #999; font-size: 12px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
            </div>
        `
    });
    console.log(`OTP email sent to ${email} (${type})`);
}

async function sendBookingEmail(userEmail, userName, eventTitle) {
    try {
        await sendEmail({
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `
                <h2>Hi ${escapeHtml(userName)}!</h2>
                <p>Your booking for the event <strong>${escapeHtml(eventTitle)}</strong> is confirmed.</p>
                <p>Thank you for choosing Eventora.</p>
            `
        });
        console.log('Booking confirmation email sent to', userEmail);
    } catch (error) {
        // Confirmation is already saved, so email trouble should not undo it.
        console.error('Failed to send booking confirmation email:', error.message);
    }
}

module.exports = {
    sendOtpEmail,
    sendOTPEmail: sendOtpEmail,
    sendBookingEmail
};
