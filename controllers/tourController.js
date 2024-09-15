// NPM Modules
const multer = require('multer');
const sharp = require('sharp');
// Custom Modules
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

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

// Capture Images When Uploaded
exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1
  },
  {
    name: 'images',
    maxCount: 3
  }
]);
// Resize Tour Images
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1. Process Cover Image
  // Create custom filename
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  // Setup our file manipulation options
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2. Process Other Images
  // Create empty array to capture all images
  req.body.images = [];
  // Capture All Images
  await Promise.all(
    req.files.images.map(async (file, i) => {
      // Setup non-cover image file names
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      // Setup our file manipulation options
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      // Assign images to array
      req.body.images.push(filename);
    })
  );

  next();
});

// Route Handler Functions
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        numTourStarts: -1
      }
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// route   /tours-within/:distance/center/:latlng/unit/:unit
// example /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  // use destructuring to get variables from the URL
  const { distance, latlng, unit } = req.params;
  // split the latitude and longitude into separate variables
  const [lat, lng] = latlng.split(',');
  // MongoDB Distance Radius conversion to radiants
  // Formula: Distance / Radius of Earth
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  // If either the LAT or LNG is missing, throw error
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format "lat,lng"',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  // use destructuring to get variables from the URL
  const { latlng, unit } = req.params;
  // split the latitude and longitude into separate variables
  const [lat, lng] = latlng.split(',');

  // Multiplier variables
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  // If either the LAT or LNG is missing, throw error
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format "lat,lng"',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    results: latlng.length,
    data: {
      data: distances
    }
  });
});
