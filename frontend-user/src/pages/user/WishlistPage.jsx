import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Heart, ArrowRight } from 'lucide-react'
import ProductCard from '../../components/user/ProductCard.jsx'
import { Loader } from '../../components/common/Loader.jsx'

const WishlistPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth)
  const { products, isLoading } = useSelector((state) => state.wishlist)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark">
        <div className="text-center px-4">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Please login to view your wishlist</h2>
          <Link to="/login" className="text-primary hover:underline">Login here</Link>
        </div>
      </div>
    )
  }

  if (isLoading) return <Loader fullScreen />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8">My Wishlist ({products.length})</h1>

        {products.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save items you love for later</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium"
            >
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {products.map((product, i) => (
              <ProductCard key={product._id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WishlistPage
