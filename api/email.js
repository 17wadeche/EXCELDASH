const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.UGH);

const sendPasswordResetEmail = async (to, resetLink) => {
  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
    html: `
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent');
  } catch (error) {
    console.error('SendGrid error:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
};
