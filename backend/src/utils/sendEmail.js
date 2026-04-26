const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Generate a test Ethereal SMTP account if we don't have real credentials
  let testAccount = await nodemailer.createTestAccount();

  // Create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, 
      pass: testAccount.pass, 
    },
  });

  const message = {
    from: '"KaziLog Admin" <noreply@kazilog.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
  // This is the magic of Ethereal. It prints a URL where we can see the fake email!
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;
