import { prisma } from "../lib/prisma.js";

export const getHealth = (req, res) => {
  res.status(200).json({
    message: "Project Management API is running!",
  });
};

export const getDatabaseHealth = async (req, res) => {
  try {
    await prisma.user.count();

    res.status(200).json({
      message: "Database connection is healthy",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
};
