import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice.js'
import cartReducer from './slices/cartSlice.js'
import wishlistReducer from './slices/wishlistSlice.js'
import orderReducer from './slices/orderSlice.js'
import couponReducer from './slices/couponSlice.js'
import productFilterReducer from './slices/productFilterSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    order: orderReducer,
    coupon: couponReducer,
    productFilter: productFilterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
      },
    }),
})
