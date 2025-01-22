// src/utils/email.js

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends a password reset email to the specified email address.
 * @param {string} to - Recipient's email address.
 * @param {string} resetLink - Password reset URL.
 */
const sendPasswordResetEmail = async (to, resetLink) => {
  const msg = {
    to,
    from: process.env.EMAIL_FROM, // Verified sender
    subject: 'Password Reset Request',
    text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
    html: `
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  await sgMail.send(msg);
};

module.exports = {
  sendPasswordResetEmail,
};
