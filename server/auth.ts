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
  
  console.log(`Setting auth cookie with hash: ${passwordHash.substring(0, 10)}...`);
  
  // For Replit environment, we need special cookie settings
  const cookieOptions = {
    maxAge: thirtyDaysInMs,
    httpOnly: true,
    path: "/",
    // Use lax for better compatibility across browsers
    sameSite: "lax" as const, 
    // Secure should be false in dev environments
    secure: false
  };
  
  // Set the auth token cookie
  res.cookie("authToken", passwordHash, cookieOptions);
  console.log("Auth token cookie set with options:", cookieOptions);
  
  // Add a second non-httpOnly cookie for client-side detection
  const clientCookieOptions = {
    ...cookieOptions,
    httpOnly: false
  };
  
  res.cookie("isLoggedIn", "true", clientCookieOptions);
  console.log("isLoggedIn cookie set with options:", clientCookieOptions);
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(res: Response) {
  console.log("Clearing authentication cookies");
  
  // Cookie options must match those used when setting the cookie
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: false
  };
  
  // Clear auth token cookie
  res.clearCookie("authToken", cookieOptions);
  console.log("Cleared authToken cookie");
  
  // Clear the client-side visible cookie as well
  const clientCookieOptions = {
    ...cookieOptions,
    httpOnly: false
  };
  
  res.clearCookie("isLoggedIn", clientCookieOptions);
  console.log("Cleared isLoggedIn cookie");
}