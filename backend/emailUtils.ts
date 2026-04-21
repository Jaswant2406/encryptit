import nodemailer from 'nodemailer';

/**
 * Sends a verification email to the user using Gmail SMTP.
 * @param toEmail The user's email address
 * @param token The unique verification token
 */
export async function sendVerificationEmail(toEmail: string, token: string) {
  const emailUser = process.env.EMAIL;
  const emailPass = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPass) {
    console.warn('⚠ Email credentials not configured. Skipping email sending.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const verificationLink = `${appUrl}/api/verify-email?token=${token}`;

  const mailOptions = {
    from: emailUser,
    to: toEmail,
    subject: 'Verify your email',
    text: `Please verify your email by clicking the following link: ${verificationLink}`,
    html: `
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
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✔ Verification email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`✘ Failed to send verification email to ${toEmail}:`, error);
  }
}

/**
 * Sends a password reset email to the user using Gmail SMTP.
 * @param toEmail The user's email address
 * @param token The unique reset token
 */
export async function sendPasswordResetEmail(toEmail: string, token: string) {
  const emailUser = process.env.EMAIL;
  const emailPass = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPass) {
    console.warn('⚠ Email credentials not configured. Skipping email sending.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: emailUser,
    to: toEmail,
    subject: 'Reset your password',
    text: `Please reset your password by clicking the following link: ${resetLink}. This link expires in 15 minutes.`,
    html: `
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
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✔ Password reset email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`✘ Failed to send password reset email to ${toEmail}:`, error);
  }
}
