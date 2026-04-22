import nodemailer from 'nodemailer';

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function isSmtpConfigured() {
  return Boolean(process.env.EMAIL && process.env.EMAIL_PASSWORD);
}

function createTransporter(emailUser: string, emailPass: string) {
  const port = Number(process.env.SMTP_PORT) || 587;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    requireTLS: port !== 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: emailUser,
      pass: emailPass.replace(/\s+/g, ''),
    },
  });
}

async function sendViaResend(toEmail: string, subject: string, text: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error('Resend is not configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend send failed: ${response.status} ${errorText}`);
  }
}

async function sendViaSmtp(toEmail: string, subject: string, text: string, html: string) {
  const emailUser = process.env.EMAIL;
  const emailPass = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPass) {
    throw new Error('SMTP credentials are not configured.');
  }

  await createTransporter(emailUser, emailPass).sendMail({
    from: process.env.EMAIL_FROM || emailUser,
    to: toEmail,
    subject,
    text,
    html,
  });
}

async function sendEmail(toEmail: string, subject: string, text: string, html: string) {
  if (isResendConfigured()) {
    await sendViaResend(toEmail, subject, text, html);
    return;
  }

  if (isSmtpConfigured()) {
    await sendViaSmtp(toEmail, subject, text, html);
    return;
  }

  throw new Error('Email delivery is not configured.');
}

export function isEmailDeliveryConfigured() {
  return isResendConfigured() || isSmtpConfigured();
}

export async function sendVerificationEmail(toEmail: string, token: string) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const verificationLink = `${appUrl}/api/verify-email?token=${token}`;

  await sendEmail(
    toEmail,
    'Verify your email',
    `Please verify your email by clicking the following link: ${verificationLink}`,
    `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
        <h2 style="color: #2563EB;">Verify your email</h2>
        <p>Thank you for signing up! Please click the button below to verify your email address and activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
        </div>
        <p style="color: #666; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 10px;">Alternatively, copy and paste this link into your browser: <br/> ${verificationLink}</p>
      </div>
    `,
  );

  console.log(`Verification email sent successfully to ${toEmail}`);
}

export async function sendPasswordResetEmail(toEmail: string, token: string) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  await sendEmail(
    toEmail,
    'Reset your password',
    `Please reset your password by clicking the following link: ${resetLink}. This link expires in 15 minutes.`,
    `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
        <h2 style="color: #2563EB;">Reset your password</h2>
        <p>We received a request to reset your password. Please click the button below to choose a new password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 12px;">This link will expire in 15 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 10px;">Alternatively, copy and paste this link into your browser: <br/> ${resetLink}</p>
      </div>
    `,
  );

  console.log(`Password reset email sent successfully to ${toEmail}`);
}
