import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";
import bcryptjs from 'bcryptjs';
import multer from 'multer';

export const test = (req, res) => {
    res.json({ message: 'API is working!' });
};

// Multer setup for file uploads (if used in the future)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('profilePicture');

// Update user details
export const updateUser = async (req, res, next) => {
    // Ensure the user is updating their own profile
    if (req.user.id !== req.params.userId) {
      return next(errorHandler(403, 'You are not allowed to update this user'));
    }
  
    // Validate password (if provided)
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return next(errorHandler(400, 'Password must be at least 6 characters'));
      }
      req.body.password = bcryptjs.hashSync(req.body.password, 10); // Hash the password
    }
  
    // Validate username (if provided)
    if (req.body.username) {
      if (req.body.username.length < 5 || req.body.username.length > 20) {
        return next(errorHandler(400, 'Username must be between 5 and 20 characters'));
      }
      if (req.body.username.includes(' ')) {
        return next(errorHandler(400, 'Username cannot contain spaces'));
      }
      if (req.body.username !== req.body.username.toLowerCase()) {
        return next(errorHandler(400, 'Username must be lowercase'));
      }
      if (!/^[a-z0-9]+$/.test(req.body.username)) {
        return next(errorHandler(400, 'Username can only contain lowercase letters and numbers'));
      }
    }
  
    try {
      // Update user with the validated data
      const updatedUser = await User.findByIdAndUpdate(
        req.params.userId,
        {
          $set: {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password, // Only update password if provided
          },
        },
        { new: true } // Return the updated user
      );
  
      // If user is not found, return error
      if (!updatedUser) {
        return next(errorHandler(404, 'User not found'));
      }
  
      // Send response with updated user data (excluding password)
      const { password, ...rest } = updatedUser._doc;
      res.status(200).json(rest);
    } catch (error) {
      next(error); // Pass any errors to the error handler
    }
};

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.userId){
    return next(errorHandler(403, 'You are not allowed to delete this user'));
  }
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.status(200).json('User has been deleted');
  }
  catch (error) {
    next(error);
  }
};
