import { createSlice } from '@reduxjs/toolkit'

const filterSlice = createSlice({
  name: 'productFilter',
  initialState: {
    searchQuery: '',
    category: '',
    subcategory: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    inStock: false,
    tags: [],
  },
  reducers: {
    setSearchQuery: (state, action) => { state.searchQuery = action.payload },
    setCategory: (state, action) => { state.category = action.payload },
    setSubcategory: (state, action) => { state.subcategory = action.payload },
    setBrand: (state, action) => { state.brand = action.payload },
    setPriceRange: (state, action) => {
      state.minPrice = action.payload.min
      state.maxPrice = action.payload.max
    },
    setSort: (state, action) => { state.sort = action.payload },
    setInStock: (state, action) => { state.inStock = action.payload },
    setTags: (state, action) => { state.tags = action.payload },
    resetFilters: (state) => {
      state.searchQuery = ''
      state.category = ''
      state.subcategory = ''
      state.brand = ''
      state.minPrice = ''
      state.maxPrice = ''
      state.sort = 'newest'
      state.inStock = false
      state.tags = []
    },
  },
})

export const { setSearchQuery, setCategory, setSubcategory, setBrand, setPriceRange, setSort, setInStock, setTags, resetFilters } = filterSlice.actions
export default filterSlice.reducer
