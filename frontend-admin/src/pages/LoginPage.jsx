import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Mail, Eye, EyeOff, Loader2, Sun, Moon, ShieldCheck, BarChart3, ShoppingBag, Users } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { setCredentials } from '../redux/slices/authSlice.js'
import api from '../services/api.js'
import Logo from '../components/ui/Logo.jsx'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password required'),
})

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { isDark, toggleTheme } = useTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', data, { headers: { 'x-admin-panel': 'true' } })
      if (res.data.user.role !== 'admin' && res.data.user.role !== 'superadmin') {
        setError('Access denied. Admin only.')
        return
      }
      dispatch(setCredentials(res.data))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    { icon: BarChart3, title: 'Analytics', desc: 'Real-time sales & traffic insights' },
    { icon: ShoppingBag, title: 'Products', desc: 'Manage your entire catalog' },
    { icon: Users, title: 'Customers', desc: 'Track & engage your users' },
    { icon: ShieldCheck, title: 'Security', desc: 'Role-based access control' },
  ]

  return (
    <div className="min-h-screen flex bg-white dark:bg-dark transition-colors duration-300">
      {/* Left Decorative Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-secondary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-12 text-white">
          <Logo size="xl" linkTo={null} onDark className="mb-6" />
          <h1 className="text-4xl font-bold mb-3 text-center">Admin Dashboard</h1>
          <p className="text-lg text-white/80 mb-12 text-center max-w-md">
            Powerful tools to manage your e-commerce store. Monitor sales, manage products, and grow your business.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-md w-full">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-colors"
              >
                <feature.icon className="w-8 h-8 mb-2 text-white" />
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-white/70 mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-md hover:shadow-lg transition-all"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>

        <div className="w-full max-w-md">
          {/* Mobile Logo - Only visible on mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" linkTo={null} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to manage your store</p>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Enter your credentials to access the admin panel</p>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-dark-border">
            {error && (
              <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="admin@example.com"
                    className="w-full px-4 py-3.5 pl-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3.5 pl-12 pr-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 mt-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
              Admin access only. Unauthorized login attempts are logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
