import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000),
});

const getFrom = () => {
  const email = process.env.FROM_EMAIL || process.env.SMTP_EMAIL;
  const name = process.env.FROM_NAME || 'ShopHubX';
  return { email, formatted: `"${name}" <${email}>` };
};

const sendWithResend = async ({ to, subject, html, attachments }) => {
  const { formatted } = getFrom();
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: formatted,
      to: [to],
      subject,
      html,
      ...(attachments.length > 0 && { attachments }),
    }),
    signal: AbortSignal.timeout(Number(process.env.EMAIL_TIMEOUT_MS || 15000)),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || `Resend email request failed (${response.status})`);
  }
  return data;
};

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const { email, formatted } = getFrom();
    if (!email) throw new Error('FROM_EMAIL or SMTP_EMAIL is not configured');

    const info = process.env.RESEND_API_KEY
      ? await sendWithResend({ to, subject, html, attachments })
      : await transporter.sendMail({ from: formatted, to, subject, html, attachments });

    console.log(`Email sent: ${info.messageId || info.id}`);
    return info;
  } catch (error) {
    console.error('Email error:', error.message);
    const isTimeout = ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION'].includes(error.code)
      || error.name === 'TimeoutError';
    if (isTimeout) {
      throw new Error('Email service connection timed out. Configure RESEND_API_KEY on Render or use an SMTP provider/port allowed by your host.');
    }
    throw new Error(`Unable to send email: ${error.message}`);
  }
};

export default transporter;
