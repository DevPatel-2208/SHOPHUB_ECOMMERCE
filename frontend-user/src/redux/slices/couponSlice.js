import { createSlice } from '@reduxjs/toolkit'

const couponSlice = createSlice({
  name: 'coupon',
  initialState: {
    appliedCoupon: null,
    availableCoupons: [],
    discount: 0,
  },
  reducers: {
    applyCoupon: (state, action) => {
      state.appliedCoupon = action.payload
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null
      state.discount = 0
    },
    setAvailableCoupons: (state, action) => {
      state.availableCoupons = action.payload
    },
  },
})

export const { applyCoupon, removeCoupon, setAvailableCoupons } = couponSlice.actions
export default couponSlice.reducer
