import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { registerSchema, loginSchema } from "../validators/auth.schemas.js";

// Helper functions
const regenerateSession = (req) => {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
};

const saveSession = (req) => {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
};

// Registeration controller
export const register = async (req, res) => {
  // 1. Validate incoming data
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid registration data",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const { name, email, password } = result.data;
  try {
    // 2. Hash the password
    const passwordHash = await argon2.hash(password);

    // 3. Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // 4. Return the created user
    return res.status(201).json({
      message: "User registered successfuly",
      user,
    });
  } catch (error) {
    // Handle duplicate email
    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }
    console.error("Registration error: ", error);
    return res.status(500).json({
      message: "Something went wrong while creating you account",
    });
  }
};

// Login controller
export const login = async (req, res) => {
  // 1. Validate input
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: "Invalid login data",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const { email, password } = result.data;

  try {
    // 2. Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    // 3. Verify credentials
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 4. Create a fresh session
    await regenerateSession(req);

    req.session.userId = user.id;

    // 5. Save the session
    await saveSession(req);

    // 6. Return user data
    return res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error: ", error);
    return res.status(500).json({
      message: "Something went wrong while logging in",
    });
  }
};

// Current-user endpoint
export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.session.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get current user error: ", error);
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

// Implement Logout
export const logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        message: "Something went wrong while logging out",
      });
    }

    res.clearCookie("pm.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  });
};
