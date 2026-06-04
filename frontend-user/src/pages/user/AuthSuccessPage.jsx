import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import { setCredentials } from '../../redux/slices/authSlice.js'
import api from '../../services/api.js'
import Logo from '../../components/ui/Logo.jsx'

const AuthSuccessPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      return
    }

    localStorage.setItem('token', token)

    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        dispatch(setCredentials({ user: res.data.user, token }))
        setStatus('success')
        setTimeout(() => navigate('/'), 1500)
      })
      .catch(() => {
        localStorage.removeItem('token')
        setStatus('error')
        setTimeout(() => navigate('/login'), 2000)
      })
  }, [searchParams, dispatch, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark dark:to-dark-card">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border p-8 sm:p-12 text-center max-w-md mx-4"
      >
        <div className="flex justify-center mb-6">
          <Logo size="lg" linkTo={null} />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Signing you in...</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Please wait while we verify your account</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </motion.div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome to ShopHubX!</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">You have been signed in successfully</p>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <XCircle className="w-10 h-10 text-danger" />
            </motion.div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Authentication Failed</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Redirecting to login...</p>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default AuthSuccessPage