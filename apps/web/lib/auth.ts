import { prisma } from "@outcomeos/database";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";

const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  } : {}),
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    }
  } : {})
};

async function sendEmail(message: { to: string; subject: string; text: string }) {
  if (!process.env.SMTP_URL) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[development email] ${message.subject} → ${message.to}\n${message.text}`);
      return;
    }
    // Silently dropping verification mail in production strands every account
    // at the unverified stage with no way forward. Fail loudly instead.
    throw new Error("Email delivery is not configured: set SMTP_URL");
  }
  const response = await fetch(process.env.SMTP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.EMAIL_API_KEY ? { authorization: `Bearer ${process.env.EMAIL_API_KEY}` } : {})
    },
    body: JSON.stringify({ ...message, from: process.env.EMAIL_FROM ?? "OutcomeOS <hello@localhost>" })
  });
  if (!response.ok) {
    throw new Error(`Email delivery failed (${response.status}): ${await response.text()}`);
  }
}

export const auth = betterAuth({
  appName: "OutcomeOS",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "development-only-secret-change-me",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV === "production",
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your OutcomeOS password",
        text: `Reset your password: ${url}`
      });
    }
  },
  emailVerification: {
    sendOnSignUp: process.env.NODE_ENV === "production",
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your OutcomeOS email",
        text: `Verify your email: ${url}`
      });
    }
  },
  socialProviders,
  account: {
    encryptOAuthTokens: true
  },
  verification: {
    modelName: "VerificationToken",
    storeIdentifier: "hashed"
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "Your OutcomeOS sign-in link",
          text: `Sign in to OutcomeOS: ${url}`
        });
      }
    })
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production"
  }
});

export type AuthSession = typeof auth.$Infer.Session;
