// Core Modules
const crypto = require('crypto');
// NPM Modules
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name.']
  },
  email: {
    type: String,
    required: [true, 'A user must have an email.'],
    unique: [true, 'An account already exists with that email.'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email.']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Provide a password'],
    minlength: [8, 'Passwords must have at least 8 characters.'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Provide a password'],
    validate: {
      validator: function(el) {
        // this only works on .create() or .save() document
        return el === this.password;
      },
      message: 'Passwords do not match.'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});
// Mongoose Pre-save middleware
userSchema.pre('save', async function(next) {
  // If the password was modified run the function
  if (!this.isModified('password')) return next();
  // Hash the password with cost of 15
  this.password = await bcrypt.hash(this.password, 15);
  // Delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  // If the password was modified run the function
  if (!this.isModified('password') || this.isNew) return next();
  // Add the passwordChangedAt date
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Remove inactive users from find queries
userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // If JWTTimestamp is greater, this returns true, meaning that the password has been changed
    return JWTTimestamp < changedTimestamp;
  }
  // False means that the password hasn't been changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);
  // 10 minutes * 60 seconds per minute * 1000 to convert to miliseconds
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
