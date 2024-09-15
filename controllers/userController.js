// NPM Modules
const multer = require('multer');
const sharp = require('sharp');
// Custom Modules
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// Multer Section

// Multer Storage Setup Without Sharp
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // Get the file extension
//     const ext = file.mimetype.split('/')[1];
//     // Combine variables to create new file name
//     // new file name: user-userID-timesamp.extension
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

// Multer Storage Setup With Sharp
const multerStorage = multer.memoryStorage();

// Multer Filter Setup
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
// Apply Multer Storage and Filter to variable
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

// Image Middleware
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // If there is no file, skip this function
  if (!req.file) return next();
  // Filename isn't defined, so we define it
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  // Setup our file manipulation options
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// Filtering Section
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Route Handling Section
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if user POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }
  // 2. Filtered out unwanted field names that are not allowed to be updated.
  const filteredBody = filterObj(
    req.body,
    'firstName',
    'lastName',
    'phone',
    'addressCity',
    'addressState',
    'addressCountry',
    'companyTitle',
    'emailSignature'
  );
  if (req.file) filteredBody.photo = req.file.filename;
  // 3. Update the user document
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );
    // 4. Send the response with the status and data
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (e) {
    res.status(500).json({
      status: 'error',
      message: 'Error updating User Data '
    });
  }
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead'
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Update User doesn't update passwords
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
