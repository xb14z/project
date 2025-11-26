const { Product, Category } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/error');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    available,
    active,
    sort,
    page = 1,
    limit = 20
  } = req.query;

  let query = {};

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Search
  if (search) {
    query.$text = { $search: search };
  }

  // Price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Availability
  if (available === 'true') {
    query.isAvailable = true;
  }

  // Active status
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Sort
  let sortOption = { createdAt: -1 };
  if (sort) {
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'popular':
        sortOption = { soldCount: -1 };
        break;
      case 'rating':
        sortOption = { 'rating.average': -1 };
        break;
    }
  }

  const products = await Product.find(query)
    .populate('category', 'name')
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    pages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    data: products
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');

  if (!product) {
    return next(new ErrorResponse('ไม่พบสินค้า', 404));
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin)
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Check if category exists
  const categoryExists = await Category.findById(req.body.category);
  if (!categoryExists) {
    return next(new ErrorResponse('ไม่พบหมวดหมู่', 404));
  }

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('ไม่พบสินค้า', 404));
  }

  // Check category if updating
  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      return next(new ErrorResponse('ไม่พบหมวดหมู่', 404));
    }
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('category', 'name');

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('ไม่พบสินค้า', 404));
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Toggle product availability
// @route   PATCH /api/products/:id/availability
// @access  Private (Admin)
exports.toggleAvailability = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('ไม่พบสินค้า', 404));
  }

  product.isAvailable = !product.isAvailable;
  await product.save();

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Update stock
// @route   PATCH /api/products/:id/stock
// @access  Private (Admin)
exports.updateStock = asyncHandler(async (req, res, next) => {
  const { stock } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock },
    { new: true, runValidators: true }
  );

  if (!product) {
    return next(new ErrorResponse('ไม่พบสินค้า', 404));
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Bulk update products
// @route   PUT /api/products/bulk
// @access  Private (Admin)
exports.bulkUpdate = asyncHandler(async (req, res, next) => {
  const { ids, update } = req.body;

  await Product.updateMany(
    { _id: { $in: ids } },
    update
  );

  const products = await Product.find({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});
