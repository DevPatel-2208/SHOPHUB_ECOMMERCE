import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice.js'
import dashboardReducer from './slices/dashboardSlice.js'
import productReducer from './slices/productSlice.js'
import categoryReducer from './slices/categorySlice.js'
import subcategoryReducer from './slices/subcategorySlice.js'
import brandReducer from './slices/brandSlice.js'
import attributeReducer from './slices/attributeSlice.js'
import productAttributeReducer from './slices/productAttributeSlice.js'
import offerReducer from './slices/offerSlice.js'
import orderReducer from './slices/orderSlice.js'
import customerReducer from './slices/customerSlice.js'
import subscriberReducer from './slices/subscriberSlice.js'
import newsletterReducer from './slices/newsletterSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    products: productReducer,
    categories: categoryReducer,
    subcategories: subcategoryReducer,
    brands: brandReducer,
    attributes: attributeReducer,
    productAttributes: productAttributeReducer,
    offers: offerReducer,
    orders: orderReducer,
    customers: customerReducer,
    subscribers: subscriberReducer,
    newsletter: newsletterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'brands/create',
          'brands/update',
          'categories/create',
          'categories/update',
          'products/create',
          'products/update',
        ],
        ignoredActionPaths: ['meta.arg', 'payload'],
      },
    }),
})
