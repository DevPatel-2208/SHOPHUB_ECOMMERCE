import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api.js'

export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/wishlist')
    return data.wishlist?.products || []
  } catch (error) {
    return rejectWithValue(error.response?.data?.message)
  }
})

export const addToWishlist = createAsyncThunk('wishlist/addToWishlist', async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/wishlist', { productId })
    return data.wishlist?.products || []
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist')
  }
})

export const removeFromWishlist = createAsyncThunk('wishlist/removeFromWishlist', async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/wishlist/${productId}`)
    return data.wishlist?.products || []
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist')
  }
})

export const toggleWishlist = createAsyncThunk('wishlist/toggleWishlist', async (productId, { getState, rejectWithValue }) => {
  try {
    const { wishlist } = getState()
    const isInWishlist = wishlist.products?.some((p) => p._id === productId)
    if (isInWishlist) {
      const { data } = await api.delete(`/wishlist/${productId}`)
      return data.wishlist?.products || []
    } else {
      const { data } = await api.post('/wishlist', { productId })
      return data.wishlist?.products || []
    }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to toggle wishlist')
  }
})

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    products: [],
    isLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => { state.isLoading = true })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false
        state.products = action.payload
      })
      .addCase(fetchWishlist.rejected, (state) => {
        state.isLoading = false
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.products = action.payload
      })
      .addCase(addToWishlist.rejected, (state) => {
        // keep previous state
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.products = action.payload
      })
      .addCase(removeFromWishlist.rejected, (state) => {
        // keep previous state
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.products = action.payload
      })
      .addCase(toggleWishlist.rejected, (state) => {
        // keep previous state
      })
  },
})

export default wishlistSlice.reducer
