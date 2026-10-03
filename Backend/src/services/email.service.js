const { Resend } = require('resend');
function escapeHtml(value = '') {
     return String(value).replace(/[&<>"']/g, (character) => ({
         '&': '&amp;',
         '<': '&lt;',
         '>': '&gt;',
         '"': '&quot;',
         "'": '&#39;'
        })[character]); }

// Create Resend client
function createResendClient() {
     const apiKey = process.env.RESEND_API_KEY;
     if (!apiKey) {
         return null;
     }

     return new Resend(apiKey);
    }
    // Common email sending function
async function sendEmail({ to, subject, html }) {
     const resend = createResendClient();
     if (!resend) {
        throw new Error(
            'Email service is not configured. Set RESEND_API_KEY in the backend environment.'
        );
    }
    // Use your verified domain email in production.
   // For testing, Resend provides onboarding@resend.dev.
   const fromEmail = process.env.EMAIL_FROM || 'Eventora <onboarding@resend.dev>';
   const { data, error } = await resend.emails.send({
   from: fromEmail,
   to: [to],
   subject,
   html
});
if (error) {
    throw new Error(error.message || 'Failed to send email');
}
return data;
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
    sendBookingEmail
};
