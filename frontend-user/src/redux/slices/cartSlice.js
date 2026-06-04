import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api.js'

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart')
    return data.cart
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart')
  }
})

export const addToCart = createAsyncThunk('cart/addToCart', async (item, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart', item)
    return data.cart
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add to cart')
  }
})

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    coupon: null,
    discountAmount: 0,
    offerDiscount: 0,
    totalAmount: 0,
    finalAmount: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearCartState: (state) => {
      state.items = []
      state.coupon = null
      state.discountAmount = 0
      state.offerDiscount = 0
      state.totalAmount = 0
      state.finalAmount = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.isLoading = true })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload?.items || []
        state.coupon = action.payload?.coupon || null
        state.discountAmount = action.payload?.discountAmount || 0
        state.offerDiscount = action.payload?.offerDiscount || 0
        state.totalAmount = action.payload?.totalAmount || 0
        state.finalAmount = action.payload?.finalAmount || 0
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload?.items || []
        state.coupon = action.payload?.coupon || null
        state.discountAmount = action.payload?.discountAmount || 0
        state.offerDiscount = action.payload?.offerDiscount || 0
        state.totalAmount = action.payload?.totalAmount || 0
        state.finalAmount = action.payload?.finalAmount || 0
      })
  },
})

export const { clearCartState } = cartSlice.actions
export default cartSlice.reducer
