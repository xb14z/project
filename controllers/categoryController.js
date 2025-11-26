const { Category } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/error');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  const { active } = req.query;
  
  let query = {};
  if (active === 'true') {
    query.isActive = true;
  }

  const categories = await Category.find(query)
    .sort('sortOrder name')
    .populate('products');

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).populate('products');

  if (!category) {
    return next(new ErrorResponse('ไม่พบหมวดหมู่', 404));
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    data: category
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('ไม่พบหมวดหมู่', 404));
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('ไม่พบหมวดหมู่', 404));
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private (Admin)
exports.reorderCategories = asyncHandler(async (req, res, next) => {
  const { categories } = req.body; // Array of { id, sortOrder }

  const updatePromises = categories.map(({ id, sortOrder }) =>
    Category.findByIdAndUpdate(id, { sortOrder })
  );

  await Promise.all(updatePromises);

  const updatedCategories = await Category.find().sort('sortOrder');

  res.status(200).json({
    success: true,
    data: updatedCategories
  });
});
