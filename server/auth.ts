import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { storage } from "./storage";

/**
 * Hash a password with SHA-256
 * @param password Plain text password
 * @returns Hashed password
 */
export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/**
 * Middleware to check if the user is authenticated
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip auth check if no password has been set yet (first-time setup)
    const sitePassword = await storage.getSitePassword();
    if (!sitePassword) {
      return next();
    }

    // Check if the user has a valid authentication token
    const authToken = req.cookies.authToken;
    if (!authToken || authToken !== sitePassword.passwordHash) {
      return res.status(401).json({ message: "Authentication required" });
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication check failed" });
  }
}

/**
 * Set authentication cookie
 */
export function setAuthCookie(res: Response, passwordHash: string) {
  // Set cookie that expires in 30 days
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  res.cookie("authToken", passwordHash, {
    maxAge: thirtyDaysInMs,
    httpOnly: true,
    sameSite: "lax", // Changed from strict to lax to work better with redirects
    path: "/",
    secure: process.env.NODE_ENV === 'production'
  });
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(res: Response) {
  res.clearCookie("authToken", {
    httpOnly: true,
    sameSite: "lax", // Match the setting in setAuthCookie
    path: "/",
    secure: process.env.NODE_ENV === 'production'
  });
}