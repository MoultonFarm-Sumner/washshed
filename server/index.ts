import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./database";
import { requireAuth } from "./auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add better cookie debugging
app.use((req, res, next) => {
  const cookies = req.headers.cookie || '';
  console.log(`Request cookies: ${cookies}`);
  next();
});

// Use a non-signed cookie parser with more permissive settings
app.use(cookieParser('farm-inventory-secret', {
  decode: decodeURIComponent,
}));

// Add middleware to log the parsed cookies for debugging
app.use((req, res, next) => {
  console.log('Parsed cookies:', req.cookies);
  next();
});

// Apply authentication middleware to API routes except for auth-related ones
app.use(/^\/api(?!\/auth\/check|\/auth\/login|\/auth\/logout).*/, requireAuth);

// Log authentication result
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && !req.path.match(/^\/api\/auth\/(check|login|logout)/)) {
    console.log(`Auth passed for ${req.method} ${req.path}`);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database
  try {
    await initializeDatabase();
    log('Database initialized successfully');
  } catch (error) {
    log(`Database initialization failed: ${error}`);
    process.exit(1);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
