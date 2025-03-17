const express = require("express");
let router = express.Router();
var bcrypt = require("bcryptjs");
const _ = require("lodash");
let { admin } = require("../../models/admin");
var jwt = require("jsonwebtoken");
var auth = require("../../middlewares/auth");
const validateadmin = require("../../middlewares/validateAdmin");

const CodeGenerator = require("node-code-generator");

//Nodemailer
const nodemailer = require("nodemailer");
let otpData = {};

const sendEmailOTP = async (email, OTP) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.AUTHENTICATION_EMAIL,
      pass: process.env.AUTHENTICATION_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Backend Services" <${process.env.AUTHENTICATION_EMAIL}>`,
    to: email,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 6px; padding: 20px;">
          <h2 style="text-align: center; color: #17aae0">Your OTP Code</h2>
          <p style="text-align: center; font-size: 24px; font-weight: bold; color: #333;">${OTP}</p>
          <p style="text-align: center; color: #666;">Use this OTP to complete your verification process. It expires in 10 minutes.</p>
        </div>
      </div>`,
  };

  await transporter.sendMail(mailOptions);
};
//login//

router.post("/login", async (req, res) => {
  try {
    let admins = await admin.findOne({ email: req.body.email });
    if (!admins)
      return res
        .status(400)
        .send({ message: "Admin with given Email does not exist" });
    let valid = await bcrypt.compare(req.body.password, admins.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid Admin or Password" });
    let token = jwt.sign(
      { _id: admins._id, email: admins.email, role: admins.role },
      process.env.JWT_PRIVATE_KEY
    );

    return res.json({ message: "Login Successfull", token, admins });
  } catch (err) {
    return res.status(400).json({ message: "Login Successfull" });
  }
});

//register//

router.post("/register", validateadmin, async (req, res) => {
  try {
    const { firstname, lastname, username, email, password, confirmpassword, address, contact } = req.body;
    console.log("Admin: ",req.body)
    // Check if admin already exists
    const Admin = await admin.findOne({ email });
    if (Admin) {
      return res.status(400).send("Admin with given Email already exists");
    }

    // Validate password confirmation
    if (confirmpassword === "") {
      return res.status(400).send("Please confirm password");
    }
    if (password !== confirmpassword) {
      return res.status(400).send("Password does not match");
    }

    // Generate a 6-digit OTP
    const OTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Store admin data and OTP temporarily
    otpData[OTP] = {
      expirationTime,
      firstname,
      lastname,
      username,
      email,
      password,
      address,
      contact,
      role: "admin", // Default role
    };

    // Send OTP via email
    await sendEmailOTP(email, OTP);

    return res.json({
      message: "OTP has been sent to your email. Kindly check your email to activate your account.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something Went Wrong Please Try Again" });
  }
});

router.post("/ActivateAccount", async (req, res) => {
  try {
    const { otp } = req.body;

    // Check if OTP data exists
    if (!otpData[otp]) {
      return res.status(400).send("Invalid OTP or OTP not sent yet");
    }

    const { expirationTime, firstname, lastname, username, email, password, address, contact, role } = otpData[otp];

    // Check if OTP is expired
    if (Date.now() > expirationTime) {
      return res.status(400).send("OTP has expired");
    }

    // Create a new admin
    const newAdmin = new admin({
      firstname,
      lastname,
      username,
      email,
      password,
      address,
      contact,
      role,
    });

    // Hash the password
    await newAdmin.generateHashedPassword();

    // Save the admin permanently
    await newAdmin.save();

    // Clear temporary OTP data
    delete otpData[otp];

    return res.send("Your account has been activated successfully.");
  } catch (err) {
    console.error(err);
    return res.status(400).send({ message: "Unsuccessful activation" });
  }
});
router.put("/forgetPassword", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if admin exists
    const Admins = await admin.findOne({ email });
    if (!Admins) {
      return res.status(400).json({ message: "Admin with given email does not exist" });
    }

    // Generate a 6-digit OTP
    const OTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Store OTP temporarily
    otpData[OTP] = {
      expirationTime,
      email,
    };

    // Update admin's resetLink with OTP
    Admins.resetLink = OTP;
    await Admins.save();

    // Send OTP via email
    await sendEmailOTP(email, OTP);

    return res.json({
      message: "A password reset code has been sent. Kindly check your email.",
      OTP,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Something went wrong. Please try again." });
  }
});
//reset password
router.put("/resetPassword", async (req, res) => {
  try {
    const { OTP, newPass } = req.body;

    // Check if OTP data exists
    if (!otpData[OTP]) {
      return res.status(400).json({ message: "Invalid OTP or OTP not sent yet" });
    }

    const { expirationTime, email } = otpData[OTP];

    // Check if OTP is expired
    if (Date.now() > expirationTime) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Find admin by email
    const Admins = await admin.findOne({ email });
    if (!Admins) {
      return res.status(400).json({ message: "Admin not found" });
    }

    // Update password
    Admins.password = newPass;
    await Admins.generateHashedPassword();
    await Admins.save();

    // Clear temporary OTP data
    delete otpData[OTP];

    return res.json({ message: "Password has been changed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Something went wrong. Please try again." });
  }
});

module.exports = router;
