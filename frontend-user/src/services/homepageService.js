import api from './api.js';

export const fetchHomepageData = async () => {
  const { data } = await api.get('/home');
  return data.data;
};

export const fetchBanners = async () => {
  const { data } = await api.get('/banners');
  return data.banners;
};

export const fetchCategories = async () => {
  const { data } = await api.get('/categories');
  return data.categories;
};

export const fetchFeaturedProducts = async () => {
  const { data } = await api.get('/products/featured');
  return data.products;
};

export const fetchNewArrivals = async () => {
  const { data } = await api.get('/products?limit=10&sort=-createdAt');
  return data.products;
};

export const fetchActiveOffers = async () => {
  const { data } = await api.get('/offers/active');
  return data.offers;
};

export const fetchTestimonials = async () => {
  const { data } = await api.get('/reviews/testimonials');
  return data.reviews;
};

export const subscribeToNewsletter = async (email) => {
  const { data } = await api.post('/subscribers', { email, source: 'homepage' });
  return data;
};

export const fetchSearchSuggestions = async (query) => {
  const { data } = await api.get(`/products?search=${encodeURIComponent(query)}&limit=5`);
  return data.products;
};