require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Temporary in-memory database (Dummy)
let tokenDatabase = {};

// Dummy subscription ID
const DUMMY_SUBSCRIPTION_ID = "sub_dummy_123";

// Endpoint to simulate a Stripe Checkout session creation
app.post("/create-checkout-session", async (req, res) => {
  try {
    // Simulate session creation
    const session = {
      id: "dummy_session_123",
      url: "http://localhost:3000/success?session_id=dummy_session_123",
    };

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to generate a token after successful dummy payment
app.post("/generate-token", async (req, res) => {
  const { session_id, email } = req.body;

  try {
    // Verify the session ID (dummy check)
    if (session_id === "dummy_session_123") {
      // Simulate subscription verification
      const subscription = { id: DUMMY_SUBSCRIPTION_ID, status: "active" };

      // Generate a unique token using JWT
      const token = jwt.sign(
        { email, subscription_id: subscription.id },
        process.env.JWT_SECRET || "dummy_secret",
        { expiresIn: "30d" } // Token expires in 30 days
      );

      // Store the token in the dummy database
      tokenDatabase[token] = {
        email,
        subscription_id: subscription.id,
        active: true,
      };

      res.json({ token });
    } else {
      res.status(400).json({ error: "Invalid session ID." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to validate tokens
app.use("/validate-token", async (req, res, next) => {
  const { token } = req.body;

  try {
    // Verify the token with JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dummy_secret");

    // Check if the token is valid and active
    if (tokenDatabase[token] && tokenDatabase[token].active) {
      req.user = decoded;
      next();
    } else {
      res.status(403).json({ error: "Invalid or expired token." });
    }
  } catch (error) {
    res.status(403).json({ error: "Token validation failed." });
  }
});

// Protected route (example)
app.get("/protected", (req, res) => {
  res.json({ message: "Welcome to the protected route!", user: req.user });
});

// Simulate webhook for subscription updates
app.post("/webhook", (req, res) => {
  const { subscription_id } = req.body;

  // Dummy webhook handling for subscription cancellation
  for (const token in tokenDatabase) {
    if (tokenDatabase[token].subscription_id === subscription_id) {
      tokenDatabase[token].active = false;
    }
  }

  res.json({ received: true });
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
