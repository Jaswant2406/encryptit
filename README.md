---
title: Encryptit
sdk: docker
app_port: 7860
---

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Encryptit

Full-stack Encryptit app with a React frontend, Express backend, SQLite storage, email verification, and Google/Gmail sign-in.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and update the values you want to use.
3. Build the frontend:
   `npm run build`
4. Run the app:
   `npm start`

For development with Vite middleware:

   `npm run dev`

## Hugging Face Spaces

Create a Docker Space and upload this repository. Hugging Face will build the included `Dockerfile` and serve the app on port `7860`.

Required Space secrets for the full auth flow:

- `JWT_SECRET`: required for secure sessions.
- `GOOGLE_CLIENT_ID`: required for Google/Gmail sign-in. Add the Space URL to this OAuth client's Authorized JavaScript origins in Google Cloud Console.
- `EMAIL` and `EMAIL_PASSWORD`: required for email/password signup verification and password reset emails. For Gmail SMTP, use a Gmail app password.
- `APP_URL`: required for email verification and password reset links. Set it to your Space URL.

- `DATABASE_PATH`: optional; defaults to `/data/database.sqlite` in Docker.

Email/password users must verify their email before login. Google/Gmail users can log in only when Google confirms that the account email is verified.
