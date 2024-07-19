const pool = require('../DATABASE/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});
//otp generation 
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = 'SELECT * FROM users WHERE email = $1';
    const existingUserResult = await pool.query(existingUser, [email]);

    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

  const hashedPassword = await bcrypt.hash(password, 10);
const otp = generateOTP();

    const insertUserQuery = `
      INSERT INTO users (username, email, password, profile, about, otp)
      VALUES ($1, $2, $3, '', '', $4)
      RETURNING *;
    `;
    const insertUserResult = await pool.query(insertUserQuery, [username, email, hashedPassword, otp]);
    const newUser = insertUserResult.rows[0];

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Your OTP for verification',
      text: `Your OTP is: ${otp}`
    };
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    res.status(200).json(newUser);
  } catch (error) {
    res.status(400).json(error);
  }
};
//________________________________________________________________________________________

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const userQuery = 'SELECT * FROM users WHERE email = $1 AND otp = $2';
    const userResult = await pool.query(userQuery, [email, otp]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    const updateUserQuery = 'UPDATE users SET verified = true WHERE email = $1 RETURNING *';
    const updateUserResult = await pool.query(updateUserQuery, [email]);
    const updatedUser = updateUserResult.rows[0];

    res.status(200).json({ message: 'OTP verified successfully', user: updatedUser });
  } catch (error) {
    res.status(400).json(error);
  }
};
//____________________________________________________________________________________________
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
      const existingUserQuery = 'SELECT * FROM users WHERE email = $1';
      const existingUserResult = await pool.query(existingUserQuery, [email]);

      if (existingUserResult.rows.length === 0) {
          return res.status(404).json({ error: 'Invalid email or password' });
      }
      const existingUser = existingUserResult.rows[0];
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
          return res.status(404).json({ error: 'Invalid email or password' });
      }
      const token = jwt.sign({ userId: existingUser.id }, 'secretkey', { expiresIn: '1h' });

      res.status(200).json({message:"logged in successfully",
        user: existingUser,
        token
    });
  } catch (err) {
      res.status(400).json({ error: `Login failed due to ${err}` });
  }
};
//_________________________________________________________________________________
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Email does not exist' });
    }
const hashedPassword = await bcrypt.hash(newPassword, 10);
            const updateUserQuery = `
      UPDATE users 
      SET password = $1 
      WHERE email = $2
      RETURNING *;
    `;
    const updateUserResult = await pool.query(updateUserQuery, [hashedPassword, email]);
    const updatedUser = updateUserResult.rows[0];

    res.status(200).json({ message: 'Password reset successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: `Request failed due to ${err}` });
  }
};
//__________________________________________________________________________________________
exports.editProfile = async (req, res) => {
  const { id } = req.params;
  const { username, email, about } = req.body;
  const uploadedImage = req.file ? req.file.filename : null; 

  try {
    const updateQuery = `
      UPDATE users
      SET username = $1,
          email = $2,
          about = $3,
          profile = $4
      WHERE id = $5
      RETURNING *;
    `;
    const params = [username, email, about, uploadedImage, id];

    const result = await pool.query(updateQuery, params);
    const updatedUser = result.rows[0];
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: `Request failed due to ${error.message}` });
  }
};