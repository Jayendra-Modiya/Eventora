const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'Eventora <onboarding@resend.dev>';

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
    if (!resendApiKey) {
        throw new Error('Email service is not configured. Set RESEND_API_KEY in the backend environment.');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from: emailFrom, to: [to], subject, html })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        const reason = result.message || result.name || `HTTP ${response.status}`;
        throw new Error(`Email provider rejected the message: ${reason}`);
    }
    return result;
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
    console.log(`OTP email accepted by provider for ${email} (${type})`);
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
        console.log('Booking confirmation email accepted by provider for', userEmail);
    } catch (error) {
        // Confirmation has already been saved; email trouble should not undo it.
        console.error('Failed to send booking confirmation email:', error.message);
    }
}

module.exports = {
    sendOtpEmail,
    sendOTPEmail: sendOtpEmail,
    sendBookingEmail
};
