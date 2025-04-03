const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; 

// Function to generate a JWT token
const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
};

// Function to verify a JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null; // Invalid token
  }
};

module.exports = { generateToken, verifyToken };
