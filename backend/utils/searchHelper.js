export const buildSearchQuery = (queryParams) => {
  const { search, category, subcategory, brand, minPrice, maxPrice, inStock, tags, sort } = queryParams;
  const query = { isActive: true };
  const sortObj = {};

  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (subcategory) query.subcategory = subcategory;
  if (brand) query.brand = { $regex: brand, $options: 'i' };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (inStock === 'true') query.stock = { $gt: 0 };
  if (tags) query.tags = { $in: tags.split(',') };

  if (sort === 'price_asc') sortObj.price = 1;
  else if (sort === 'price_desc') sortObj.price = -1;
  else if (sort === 'rating') sortObj.ratings = -1;
  else if (sort === 'name_asc') sortObj.name = 1;
  else if (sort === 'newest') sortObj.createdAt = -1;
  else sortObj.createdAt = -1;

  return { query, sortObj };
};
