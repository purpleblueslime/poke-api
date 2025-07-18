import nodemailer from 'nodemailer';

const { emailPass } = process.env;

const tp = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'purpleblueslime@gmail.com',
    pass: emailPass,
  },
});

export default async function sendEmail(to, code) {
  const mailOptions = {
    from: 'purpleblueslime@gmail.com',
    to: to,
    subject: 'Verify your Poke login',
    text: `Use this OTP to log in: ${code}`,
  };

  try {
    const info = await tp.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}:`, info.response);
    return info;
  } catch (error) {
    console.error('cant send OTP email:', error);
    return null;
  }
}
