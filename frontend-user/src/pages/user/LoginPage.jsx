import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Smartphone, ArrowLeft, Loader2, Sun, Moon, Truck, Shield, Headphones, RotateCcw } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../../redux/slices/authSlice.js'
import { useTheme } from '../../context/ThemeContext.jsx'
import api from '../../services/api.js'
import toast from 'react-hot-toast'
import Logo from '../../components/ui/Logo.jsx'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [registeredData, setRegisteredData] = useState(null)
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberedEmail') ? true : false)
  const { isDark, toggleTheme } = useTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: localStorage.getItem('rememberedEmail') || '', password: '' },
  })

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm({ resolver: zodResolver(registerSchema) })

  const {
    register: otpRegister,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm({ resolver: zodResolver(otpSchema) })

  const onLogin = async (data) => {
    setIsLoading(true)
    try {
      const res = await api.post('/auth/login', data)
      dispatch(setCredentials(res.data))
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const onRegister = async (data) => {
    setIsLoading(true)
    try {
      await api.post('/auth/register', data)
      setUserEmail(data.email)
      setRegisteredData(data)
      setOtpSent(true)
      toast.success('OTP sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const onVerifyOTP = async (data) => {
    setIsLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', { email: userEmail, otp: data.otp })
      dispatch(setCredentials(res.data))
      toast.success('Account verified successfully!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/auth/google`
  }

  const handleResendOTP = async () => {
    try {
      await api.post('/auth/resend-otp', { email: userEmail })
      toast.success('New OTP sent!')
    } catch (err) {
      toast.error('Failed to resend OTP')
    }
  }

  const benefits = [
    { icon: Truck, text: 'Free shipping on orders ₹499+' },
    { icon: Shield, text: '100% secure payments' },
    { icon: RotateCcw, text: 'Easy 30-day returns' },
    { icon: Headphones, text: '24/7 customer support' },
  ]

  return (
    <div className="min-h-screen flex bg-white dark:bg-dark transition-colors duration-300">
      {/* Left Decorative Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-primary-dark to-secondary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-12 text-white">
          <Logo size="xl" linkTo={null} onDark className="mb-6" />
          <h1 className="text-4xl font-bold mb-3 text-center">Welcome to ShopHub</h1>
          <p className="text-lg text-white/80 mb-10 text-center max-w-md">
            Discover premium products at amazing prices. Join thousands of happy customers shopping with us.
          </p>

          {/* Benefits */}
          <div className="space-y-4 max-w-sm w-full">
            {benefits.map((benefit) => (
              <div
                key={benefit.text}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <benefit.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Trust indicator */}
          <div className="mt-10 flex items-center gap-2 text-white/60 text-sm">
            <Shield className="w-4 h-4" />
            <span>Trusted by 50,000+ customers across India</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-md hover:shadow-lg transition-all"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo - Only visible on mobile/tablet */}
          <div className="lg:hidden text-center mb-6">
            <Logo size="md" />
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {otpSent ? 'Verify Your Email' : activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {otpSent ? 'Enter the OTP sent to your email' : activeTab === 'login' ? 'Sign in to continue shopping' : 'Join us and start shopping today'}
            </p>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border overflow-hidden">
            {/* Tabs */}
            {!otpSent && (
              <div className="flex border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark">
                {['login', 'register'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors relative ${
                      activeTab === tab
                        ? 'text-primary'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="p-5 sm:p-6 lg:p-7">
              <AnimatePresence mode="wait">
                {otpSent ? (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <button
                      onClick={() => setOtpSent(false)}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary dark:text-gray-400 mb-5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    {/* Mobile heading for OTP */}
                    <div className="lg:hidden mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verify Your Email</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter the OTP sent to {userEmail}</p>
                    </div>

                    <form onSubmit={handleOtpSubmit(onVerifyOTP)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">OTP Code</label>
                        <div className="relative">
                          <input
                            {...otpRegister('otp')}
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            className="w-full px-4 py-3.5 pl-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-center text-xl tracking-[0.3em] font-bold text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                          />
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        {otpErrors.otp && (
                          <p className="text-danger text-xs mt-1.5">{otpErrors.otp.message}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                      </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                      Didn't receive?{' '}
                      <button onClick={handleResendOTP} className="text-primary hover:underline font-medium">
                        Resend OTP
                      </button>
                    </p>
                  </motion.div>
                ) : activeTab === 'login' ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    {/* Mobile heading for login */}
                    <div className="lg:hidden mb-5">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Welcome Back!</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                        <div className="relative">
                          <input
                            {...loginRegister('email')}
                            type="email"
                            placeholder="Enter your email"
                            className="w-full px-4 py-3.5 pl-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                          />
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        {loginErrors.email && (
                          <p className="text-danger text-xs mt-1.5">{loginErrors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                        <div className="relative">
                          <input
                            {...loginRegister('password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            className="w-full px-4 py-3.5 pl-12 pr-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                          />
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {loginErrors.password && (
                          <p className="text-danger text-xs mt-1.5">{loginErrors.password.message}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          Remember me
                        </label>
                        <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                          Forgot password?
                        </Link>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                      </button>
                    </form>

                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-dark-border" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 text-xs">Or continue with</span>
                      </div>
                    </div>

                    <motion.button
                      onClick={handleGoogleLogin}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 border border-gray-200 dark:border-dark-border rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-hover hover:shadow-md transition-all text-gray-700 dark:text-gray-200 text-sm font-medium group"
                    >
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                      <span>Continue with Google</span>
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {/* Mobile heading for register */}
                    <div className="lg:hidden mb-5">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Account</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join us and start shopping</p>
                    </div>

                    <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                        <div className="relative">
                          <input
                            {...registerRegister('name')}
                            type="text"
                            placeholder="Enter your full name"
                            className="w-full px-4 py-3.5 pl-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                          />
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        {registerErrors.name && (
                          <p className="text-danger text-xs mt-1.5">{registerErrors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                        <div className="relative">
                          <input
                            {...registerRegister('email')}
                            type="email"
                            placeholder="Enter your email"
                            className="w-full px-4 py-3.5 pl-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                          />
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        {registerErrors.email && (
                          <p className="text-danger text-xs mt-1.5">{registerErrors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                        <div className="relative">
                          <input
                            {...registerRegister('phone')}
                            type="tel"
                            placeholder="Enter 10-digit phone number"
                            className="w-full px-4 py-3.5 pl-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                          />
                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        {registerErrors.phone && (
                          <p className="text-danger text-xs mt-1.5">{registerErrors.phone.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                        <div className="relative">
                          <input
                            {...registerRegister('password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a password (min 6 chars)"
                            className="w-full px-4 py-3.5 pl-12 pr-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                          />
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {registerErrors.password && (
                          <p className="text-danger text-xs mt-1.5">{registerErrors.password.message}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                      </button>
                    </form>

                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-dark-border" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 text-xs">Or continue with</span>
                      </div>
                    </div>

                      <motion.button
                        onClick={handleGoogleLogin}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 border border-gray-200 dark:border-dark-border rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-hover hover:shadow-md transition-all text-gray-700 dark:text-gray-200 text-sm font-medium group"
                      >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                        <span>Continue with Google</span>
                      </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
            By continuing, you agree to our{' '}
            <Link to="#" className="text-primary hover:underline">Terms of Service</Link>{' '}
            and{' '}
            <Link to="#" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage
