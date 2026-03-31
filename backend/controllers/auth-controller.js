import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Verification from "../models/verification.js";
import { sendEmail } from "../libs/send-email.js";
import aj from "../libs/arcjet.js";
import { shouldBypassEmail } from "../libs/runtime-config.js";

const verificationTokenTtlMs = 60 * 60 * 1000;
const resetPasswordTokenTtlMs = 15 * 60 * 1000;

const logDevelopmentLink = (label, link) => {
  console.log(`[dev] ${label}: ${link}`);
};

const createVerificationRecord = async (userId, token, expiresInMs) => {
  await Verification.create({
    userId,
    token,
    expiresAt: new Date(Date.now() + expiresInMs),
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = req.body.email.trim().toLowerCase();

    const decision = await aj.protect(req, { email });
    console.log("Arcjet decision", decision.isDenied());

    if (decision.isDenied()) {
      return res.status(403).json({ message: "Invalid email address" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email address already in use",
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashPassword,
      name,
      isEmailVerified: shouldBypassEmail,
    });

    if (shouldBypassEmail) {
      return res.status(201).json({
        message:
          "Account created successfully. Email verification is skipped in local development.",
      });
    }

    const verificationToken = jwt.sign(
      { userId: newUser._id, purpose: "email-verification" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await createVerificationRecord(
      newUser._id,
      verificationToken,
      verificationTokenTtlMs
    );

    // send email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const emailBody = `<p>Click <a href="${verificationLink}">here</a> to verify your email</p>`;
    const emailSubject = "Verify your email";

    const isEmailSent = await sendEmail(email, emailSubject, emailBody);

    if (!isEmailSent) {
      return res.status(500).json({
        message: "Failed to send verification email",
      });
    }

    return res.status(201).json({
      message:
        "Verification email sent to your email. Please check and verify your account.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const password = req.body.password;
    const email = req.body.email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      if (shouldBypassEmail) {
        user.isEmailVerified = true;
        await Promise.all([
          user.save(),
          Verification.deleteMany({ userId: user._id }),
        ]);
      } else {
        const existingVerification = await Verification.findOne({
          userId: user._id,
        });

        if (
          existingVerification &&
          existingVerification.expiresAt > new Date()
        ) {
          return res.status(403).json({
            message:
              "Email not verified. Please check your email for the verification link.",
            requiresEmailVerification: true,
          });
        }

        if (existingVerification) {
          await Verification.findByIdAndDelete(existingVerification._id);
        }

        const verificationToken = jwt.sign(
          { userId: user._id, purpose: "email-verification" },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        await createVerificationRecord(
          user._id,
          verificationToken,
          verificationTokenTtlMs
        );

        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const emailBody = `<p>Click <a href="${verificationLink}">here</a> to verify your email</p>`;
        const emailSubject = "Verify your email";

        const isEmailSent = await sendEmail(email, emailSubject, emailBody);

        if (!isEmailSent) {
          return res.status(500).json({
            message: "Failed to send verification email",
          });
        }

        return res.status(403).json({
          message:
            "Verification email sent to your email. Please check and verify your account.",
          requiresEmailVerification: true,
        });
      }
    }

    const token = jwt.sign(
      { userId: user._id, purpose: "login" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.lastLogin = new Date();
    await user.save();

    const userData = user.toObject();
    delete userData.password;

    return res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId, purpose } = payload;

    if (purpose !== "email-verification") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const verification = await Verification.findOne({
      userId,
      token,
    });

    if (!verification) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isTokenExpired = verification.expiresAt < new Date();

    if (isTokenExpired) {
      return res.status(401).json({ message: "Token expired" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    user.isEmailVerified = true;
    await user.save();

    await Verification.findByIdAndDelete(verification._id);

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const resetPasswordRequest = async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.isEmailVerified) {
      if (shouldBypassEmail) {
        user.isEmailVerified = true;
        await Promise.all([
          user.save(),
          Verification.deleteMany({ userId: user._id }),
        ]);
      } else {
        return res
          .status(400)
          .json({ message: "Please verify your email first" });
      }
    }

    const existingVerification = await Verification.findOne({
      userId: user._id,
    });

    if (existingVerification && existingVerification.expiresAt > new Date()) {
      return res.status(400).json({
        message: "Reset password request already sent",
      });
    }

    if (existingVerification && existingVerification.expiresAt < new Date()) {
      await Verification.findByIdAndDelete(existingVerification._id);
    }

    const resetPasswordToken = jwt.sign(
      { userId: user._id, purpose: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    await createVerificationRecord(
      user._id,
      resetPasswordToken,
      resetPasswordTokenTtlMs
    );

    const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;
    const emailBody = `<p>Click <a href="${resetPasswordLink}">here</a> to reset your password</p>`;
    const emailSubject = "Reset your password";

    if (shouldBypassEmail) {
      logDevelopmentLink(`Reset password link for ${email}`, resetPasswordLink);
      return res.status(200).json({
        message:
          "Reset password link generated in local development. Check the backend terminal for the link.",
        resetPasswordLink,
      });
    }

    const isEmailSent = await sendEmail(email, emailSubject, emailBody);

    if (!isEmailSent) {
      return res.status(500).json({
        message: "Failed to send reset password email",
      });
    }

    return res.status(200).json({ message: "Reset password email sent" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyResetPasswordTokenAndResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId, purpose } = payload;

    if (purpose !== "reset-password") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const verification = await Verification.findOne({
      userId,
      token,
    });

    if (!verification) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isTokenExpired = verification.expiresAt < new Date();

    if (isTokenExpired) {
      return res.status(401).json({ message: "Token expired" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const salt = await bcrypt.genSalt(10);

    const hashPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashPassword;
    await user.save();

    await Verification.findByIdAndDelete(verification._id);

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export {
  registerUser,
  loginUser,
  verifyEmail,
  resetPasswordRequest,
  verifyResetPasswordTokenAndResetPassword,
};
