import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb } from './database';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailUtils';
import { hashPassword, verifyPassword, createAccessToken, verifyAccessToken } from './auth';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const DEFAULT_GOOGLE_CLIENT_ID = '457661341021-1aol2pb2b6pn1in0e1ku2nk88sk22o4j.apps.googleusercontent.com';
const googleClientId = process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
const isEmailConfigured = () => Boolean(process.env.EMAIL && process.env.EMAIL_PASSWORD);
const appUrl = process.env.APP_URL || 'http://localhost:3000';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.use(cors());

  app.get('/api/config', (req: Request, res: Response) => {
    res.json({
      googleClientId,
    });
  });

  // --- Validation Helpers ---
  const validatePassword = (password: string) => {
    const minLength = 6;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (password.length < minLength) return "Password must be at least 6 characters";
    if (!hasUpper) return "Password must contain at least 1 uppercase letter";
    if (!hasLower) return "Password must contain at least 1 lowercase letter";
    if (!hasNumber) return "Password must contain at least 1 number";
    return null;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // --- Middleware ---
  const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };

  const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: "Not authenticated" });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload || !payload.sub) {
      return res.status(401).json({ detail: "Invalid or expired token" });
    }

    (req as any).user = payload;
    next();
  };

  const completeGoogleSignIn = async (token: string) => {
    if (!googleClient) {
      throw new Error('Google authentication is not configured');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new Error('Invalid Google token');
    }
    if (!payload.email_verified) {
      throw new Error('Google account email is not verified');
    }

    const email = payload.email;
    const db = await getDb();
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      await db.run('INSERT INTO users (email, name, email_verified) VALUES (?, ?, 1)', [email, payload.name || email.split('@')[0]]);
    } else if (user.email_verified === 0) {
      await db.run(
        'UPDATE users SET email_verified = 1, verification_token = NULL, name = COALESCE(name, ?) WHERE email = ?',
        [payload.name || email.split('@')[0], email]
      );
    }

    return {
      accessToken: createAccessToken({ sub: email }),
      email,
      name: payload.name || email.split('@')[0],
    };
  };

  // --- API Routes ---

  // Sign Up
  app.post('/api/signup', asyncHandler(async (req: Request, res: Response) => {
    const { email, password, confirmPassword, name } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ detail: "Email and password are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ detail: "Invalid email format" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ detail: passwordError });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ detail: "Passwords do not match" });
    }

    const db = await getDb();
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ detail: "Email already registered" });
    }

    if (!isEmailConfigured()) {
      return res.status(503).json({
        detail: "Email verification is required, but email sending is not configured. Set EMAIL, EMAIL_PASSWORD, and APP_URL."
      });
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    await db.run(
      'INSERT INTO users (email, password, name, verification_token, email_verified) VALUES (?, ?, ?, ?, ?)', 
      [
        email,
        hashedPassword,
        name || email.split('@')[0],
        verificationToken,
        0
      ]
    );

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Verification email failed:', error);
      await db.run('DELETE FROM users WHERE email = ? AND email_verified = 0', [email]);
      return res.status(502).json({
        detail: "Could not send verification email. Check the app email settings and try again."
      });
    }

    res.status(201).json({ message: "Check your email to verify your account" });
  }));

  // Resend Verification Email
  app.post('/api/resend-verification', asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ detail: "Email is required" });
    if (!isEmailConfigured()) {
      return res.status(503).json({
        detail: "Email verification is required, but email sending is not configured. Set EMAIL, EMAIL_PASSWORD, and APP_URL."
      });
    }

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      // For security, don't reveal if user exists, but here we can be more helpful
      return res.status(404).json({ detail: "User not found" });
    }

    if (user.email_verified === 1) {
      return res.status(400).json({ detail: "Email already verified" });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await db.run('UPDATE users SET verification_token = ? WHERE id = ?', [verificationToken, user.id]);

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Verification email failed:', error);
      return res.status(502).json({
        detail: "Could not send verification email. Check the app email settings and try again."
      });
    }

    res.json({ message: "Verification email resent. Please check your inbox." });
  }));

  // Verify Email
  app.get('/api/verify-email', asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ detail: "Token is required" });

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE verification_token = ?', [token]);

    if (!user) {
      return res.status(400).json({ detail: "Invalid verification token" });
    }

    await db.run('UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?', [user.id]);

    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h1 style="color: #059669;">Email Verified!</h1>
            <p style="color: #4b5563;">Your account is now active. You can close this window and log in.</p>
          </div>
        </body>
      </html>
    `);
  }));

  // Sign In
  app.post('/api/login', asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ detail: "Invalid email format" });
    }

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ detail: "Incorrect email or password" });
    }

    if (user.email_verified === 0) {
      return res.status(403).json({ detail: "Please verify your email before logging in" });
    }

    const accessToken = createAccessToken({ sub: user.email });
    res.json({ access_token: accessToken, token_type: "bearer" });
  }));

  // Google Auth
  app.post('/api/auth/google', asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    try {
      const result = await completeGoogleSignIn(token);
      res.json({ access_token: result.accessToken, token_type: "bearer", email: result.email, name: result.name });
    } catch (error) {
      console.error('Google Auth Error:', error);
      res.status(400).json({ detail: "Google authentication failed" });
    }
  }));

  app.post('/api/auth/google/redirect', asyncHandler(async (req: Request, res: Response) => {
    const token = req.body.credential;

    if (!token) {
      return res.redirect(`${appUrl}/?google_error=missing_credential`);
    }

    try {
      const result = await completeGoogleSignIn(token);
      res.cookie('encryptit_access_token', result.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });
      res.redirect(`${appUrl}/?google_login=1`);
    } catch (error) {
      console.error('Google Redirect Auth Error:', error);
      res.redirect(`${appUrl}/?google_error=auth_failed`);
    }
  }));

  // Forgot Password
  app.post('/api/forgot-password', asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      // For security, don't reveal if user exists
      return res.json({ message: "If this email is registered, a reset link will be sent." });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.run(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, expiry.toISOString(), email]
    );

    try {
      await sendPasswordResetEmail(email, token);
    } catch (error) {
      console.error('Password reset email failed:', error);
      return res.status(502).json({
        detail: "Could not send password reset email. Check the app email settings and try again."
      });
    }

    res.json({ message: "If this email is registered, a reset link will be sent." });
  }));

  // Reset Password
  app.post('/api/reset-password', asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    const db = await getDb();

    const user = await db.get(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?',
      [token, new Date().toISOString()]
    );

    if (!user) {
      return res.status(400).json({ detail: "Invalid or expired token" });
    }

    const hashedPassword = await hashPassword(newPassword);
    await db.run(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ message: "Password updated successfully" });
  }));

  // File Management Routes
  app.get('/api/files', authenticateToken, asyncHandler(async (req: any, res) => {
    const db = await getDb();
    const files = await db.all('SELECT * FROM files WHERE user_email = ? ORDER BY date DESC', [req.user.sub]);
    
    // Map snake_case to camelCase for the frontend
    const mappedFiles = files.map(file => ({
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      date: file.date,
      encryptionType: file.encryption_type,
      entropyBefore: file.entropy_before,
      entropyAfter: file.entropy_after
    }));
    
    res.json(mappedFiles);
  }));

  app.post('/api/files', authenticateToken, asyncHandler(async (req: any, res) => {
    const { 
      id, 
      name, 
      size, 
      type, 
      date, 
      encryption_type, 
      encryptionType,
      entropy_before, 
      entropyBefore,
      entropy_after,
      entropyAfter
    } = req.body;
    
    const db = await getDb();
    
    // Ensure name has .enc suffix if requested
    const fileName = name.endsWith('.enc') ? name : `${name}.enc`;
    
    await db.run(
      `INSERT INTO files (id, user_email, name, size, type, date, encryption_type, entropy_before, entropy_after) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        req.user.sub, 
        fileName, 
        size, 
        type, 
        date, 
        encryption_type || encryptionType, 
        entropy_before || entropyBefore, 
        entropy_after || entropyAfter
      ]
    );
    
    res.status(201).json({ message: 'File record saved' });
  }));

  app.delete('/api/files/:id', authenticateToken, asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const db = await getDb();
    
    const result = await db.run('DELETE FROM files WHERE id = ? AND user_email = ?', [id, req.user.sub]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }
    
    res.json({ message: 'File record deleted' });
  }));

  // Protected Route: /me
  app.get('/api/me', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userPayload = (req as any).user;
    const db = await getDb();
    const user = await db.get('SELECT email, name FROM users WHERE email = ?', [userPayload.sub]);
    res.json(user);
  }));

  // Update Profile
  app.post('/api/update-profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    const userPayload = (req as any).user;
    const db = await getDb();
    
    await db.run('UPDATE users SET name = ? WHERE email = ?', [name, userPayload.sub]);
    res.json({ message: 'Profile updated successfully' });
  }));

  // --- Error Handler ---
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ detail: "An internal server error occurred" });
  });

  // --- Vite Integration ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
