import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (res.headersSent) return next(err);
  res.status(status).json({ message });
});

const ready = registerRoutes(httpServer, app);

// Serve static frontend files — __dirname is api/ so dist/public is one level up
const staticPath = path.join(__dirname, "..", "dist", "public");
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

export default async function handler(req: Request, res: Response) {
  await ready;
  app(req, res);
}
