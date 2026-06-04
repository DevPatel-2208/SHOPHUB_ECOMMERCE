import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AdminLayout from './components/AdminLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import ProductFormPage from './pages/ProductFormPage.jsx'
import ReviewsPage from './pages/ReviewsPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import SubcategoriesPage from './pages/SubcategoriesPage.jsx'
import BrandsPage from './pages/BrandsPage.jsx'
import AttributesPage from './pages/AttributesPage.jsx'
import ProductAttributesPage from './pages/ProductAttributesPage.jsx'
import OfferFormPage from './pages/OfferFormPage.jsx'
import OffersPage from './pages/OffersPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import CustomersPage from './pages/CustomersPage.jsx'
import SubscribersPage from './pages/SubscribersPage.jsx'
import NewsletterPage from './pages/NewsletterPage.jsx'
import NotificationHistoryPage from './pages/NotificationHistoryPage.jsx'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth)
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/edit/:id" element={<ProductFormPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="subcategories" element={<SubcategoriesPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="attributes" element={<AttributesPage />} />
        <Route path="product-attributes" element={<ProductAttributesPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="offers/new" element={<OfferFormPage />} />
        <Route path="offers/edit/:id" element={<OfferFormPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="subscribers" element={<SubscribersPage />} />
        <Route path="newsletter" element={<NewsletterPage />} />
        <Route path="notifications" element={<NotificationHistoryPage />} />
      </Route>
    </Routes>
  )
}

export default App
