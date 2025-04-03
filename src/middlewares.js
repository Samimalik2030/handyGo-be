import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

export default function middlewares(app) {
  
  app.use(helmet());
  app.use(
    cors({
      origin: "http://localhost:5173", 
      methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(morgan("dev"));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
  });

  app.use(limiter);
  app.use(express.json());
}
