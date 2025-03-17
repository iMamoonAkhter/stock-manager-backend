const express = require("express");
let router = express.Router();
var bcrypt = require("bcryptjs");
const _ = require("lodash");
const config = require("config");
let { user } = require("../../models/users");
var jwt = require("jsonwebtoken");
var auth = require("../../middlewares/auth");
const validateusers = require("../../middlewares/validateUser");
const CodeGenerator = require("node-code-generator");
const nodemailer = require('nodemailer');



/* Get All Users */
router.get("/", async function (req, res) {
  try {
    let User = await user.find();
    return res.send(User);
  } catch (error) {
    console.error("Error in / route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// Login //
router.post("/login", async (req, res) => {
  try {
    let users = await user.findOne({ email: req.body.email });
    if (!users)
      return res
        .status(400)
        .send({ message: "User with given Email does not exist" });
    let status = await user.findOne({
      email: req.body.email,
      ActivationStatus: true,
    });
    if (!status)
      return res.status(400).send({ message: "Your account is deactivated" });
    let valid = await bcrypt.compare(req.body.password, users.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid User or Password" });
    let token = jwt.sign(
      { _id: users._id, email: users.email, role: users.role },
      process.env.jwtPrivateKey
    );

    return res.json({ message: "Login Successful", token, users });
  } catch (err) {
    console.error("Error in /login route:", err);
    return res.status(400).json({ message: "Login Failed", error: err });
  }
});

// Nodemailer
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

// Register //
router.post("/register", validateusers, async (req, res) => {
  try {
    const { firstname, lastname, id, email, password, confirmpassword, address, contact, country, province, city, zipcode } = req.body;

    // Check if user already exists
    const Users = await user.findOne({ email });
    if (Users) {
      return res.status(400).send("User with given Email already exists");
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

    // Store user data and OTP temporarily
    otpData[OTP] = {
      expirationTime,
      firstname,
      lastname,
      id,
      email,
      password,
      address,
      contact,
      country,
      province,
      city,
      zipcode,
    };
    console.log("OTP: ", OTP);
    console.log(otpData[OTP]);

    // Send OTP via email
    await sendEmailOTP(email, OTP);

    return res.json({
      message: "OTP has been sent to your email. Kindly check your email to activate your account.",
    });
  } catch (err) {
    console.error("Error in /register route:", err);
    return res.status(500).json({ message: "Something Went Wrong Please Try Again" });
  }
});

// Activate Account //
router.post("/ActivateAccount", async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(req.body);
    console.log("OTP: ", otp);

    // Check if OTP data exists
    if (!otpData[otp]) {
      return res.status(400).send("Invalid OTP or OTP not sent yet");
    }

    const { expirationTime, firstname, lastname, id, email, password, address, contact, country, province, city, zipcode } = otpData[otp];

    // Check if OTP is expired
    if (Date.now() > expirationTime) {
      return res.status(400).send("OTP has expired");
    }

    // Create a new user
    const newUser = new user({
      firstname,
      lastname,
      id,
      email,
      password,
      address,
      contact,
      country,
      province,
      city,
      zipcode,
      role: "user", // Default role
      ActivationStatus: true, // Account is activated
    });

    // Hash the password
    await newUser.generateHashedPassword();

    // Save the user permanently
    await newUser.save();

    // Clear temporary OTP data
    delete otpData[otp];

    return res.send("Your account has been activated successfully.");
  } catch (err) {
    console.error("Error in /ActivateAccount route:", err);
    return res.status(400).send({ message: "Unsuccessful activation" });
  }
});

/*
router.put('/updateAddress/:id', async function(req, res) {
  var User = await user.findById(req.params.id);
  if(!User) return res.status(400).send('somethin went wrong');

  user.updateOne({_id:User}, {$push:{address: req.body.address}}, {new: true}, (err, doc) => {
    if (err) {
      return res.send(err);
    }
    return res.send('Address updated successfully');
  });
});
*/

/* Delete Single Address */
/*
router.delete("/:id/:ID", async function(req, res){
  try {
    var User = await user.findById(req.params.id);
    if(!User) return res.status(400).send('somethin went wrong');

    user.updateOne({_id:User}, {$pull:{address: {_id:req.params.ID}}}, {new: true}, (err, doc) => {
      if (err) {
        return res.send(err);
      }
      return res.send('Address deleted successfully');
    });
  } catch (err) {
    return res.status(400).send('Invalid ID');
  }
});
*/

/* Forget Password */
router.put("/forgetPassword", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const Users = await user.findOne({ email });
    if (!Users) {
      return res.status(400).json({ message: "User with given email does not exist" });
    }

    // Generate a 6-digit OTP
    const OTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Store OTP temporarily
    otpData[OTP] = {
      expirationTime,
      email,
    };

    // Update user's resetLink with OTP (as a string)
    Users.resetLink = OTP;
    await Users.save();

    // Send OTP via email
    await sendEmailOTP(email, OTP);

    return res.json({
      message: "A password reset code has been sent. Kindly check your email.",
      OTP,
    });
  } catch (err) {
    console.error("Error in /forgetPassword route:", err);
    return res.status(400).json({ message: "Something went wrong. Please try again." });
  }
});

// Reset Password //
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

    // Find user by email
    const Users = await user.findOne({ email });
    if (!Users) {
      return res.status(400).json({ message: "User not found" });
    }

    // Update password
    Users.password = newPass;
    await Users.generateHashedPassword();
    await Users.save();

    // Clear temporary OTP data
    delete otpData[OTP];

    return res.json({ message: "Password has been changed successfully" });
  } catch (err) {
    console.error("Error in /resetPassword route:", err);
    return res.status(400).json({ message: "Something went wrong. Please try again." });
  }
});

// Deactivate User //
router.put("/deactivate/:id", async function (req, res) {
  try {
    var User = await user.findById(req.params.id);
    if (!User) return res.status(400).send("Something went wrong");

    user.updateOne(
      { _id: User },
      { $set: { ActivationStatus: false } },
      { new: true },
      (err, doc) => {
        if (err) {
          return res.send(err);
        }
        return res.send("User deactivated successfully");
      }
    );
  } catch (err) {
    console.error("Error in /deactivate/:id route:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Reactivate User //
router.put("/Reactivate", async function (req, res) {
  try {
    var User = await user.findOne({ email: req.body.email });
    if (!User) return res.status(400).send("User does not exist");
    var User = await user.findOne({
      email: req.body.email,
      ActivationStatus: false,
    });
    if (!User) return res.status(400).send("User is already activated");

    user.updateOne(
      { email: req.body.email },
      { $set: { ActivationStatus: true } },
      { new: true },
      (err, doc) => {
        if (err) {
          return res.send(err);
        }
        return res.send("User Reactivated successfully");
      }
    );
  } catch (err) {
    console.error("Error in /Reactivate route:", err);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;