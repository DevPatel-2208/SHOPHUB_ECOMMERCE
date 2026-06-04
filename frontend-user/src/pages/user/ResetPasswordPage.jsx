import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Loader2, Sun, Moon, Shield, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import api from '../../services/api.js'
import toast from 'react-hot-toast'
import Logo from '../../components/ui/Logo.jsx'

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const ResetPasswordPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tokenError, setTokenError] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetSchema) })

  const onSubmit = async (data) => {
    if (!token) {
      setTokenError(true)
      return
    }
    setIsLoading(true)
    try {
      await api.put(`/auth/reset-password/${token}`, { password: data.password })
      setSuccess(true)
      toast.success('Password reset successful!')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password'
      toast.error(msg)
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        setTokenError(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    'Choose a strong password',
    'Minimum 6 characters required',
    'Use letters, numbers & symbols',
    'Never share your password',
  ]

  return (
    <div className="min-h-screen flex bg-white dark:bg-dark transition-colors duration-300">
      {/* Left Decorative Panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-primary-dark to-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-12 text-white">
          <Logo size="xl" linkTo={null} onDark className="mb-6" />
          <h1 className="text-4xl font-bold mb-3 text-center">Set New Password</h1>
          <p className="text-lg text-white/80 mb-10 text-center max-w-md">
            Create a strong password for your account.
          </p>

          <div className="space-y-4 max-w-sm w-full">
            {benefits.map((text, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-2 text-white/60 text-sm">
            <Shield className="w-4 h-4" />
            <span>Your security matters to us</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
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
          <div className="lg:hidden text-center mb-6">
            <Logo size="md" />
          </div>

          <div className="hidden lg:block mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {success ? 'Password Updated!' : tokenError ? 'Invalid Link' : 'Reset Password'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {success
                ? 'Your password has been changed successfully'
                : tokenError
                ? 'This reset link is invalid or has expired'
                : 'Enter your new password below'}
            </p>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border overflow-hidden">
            <div className="p-5 sm:p-6 lg:p-7">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div className="lg:hidden mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Password Updated!</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Redirecting to login...</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    You can now sign in with your new password.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                  >
                    Go to Login
                  </Link>
                </motion.div>
              ) : tokenError ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-10 h-10 text-danger" />
                  </div>
                  <div className="lg:hidden mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invalid Link</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This reset link is no longer valid</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    The password reset link is invalid or has expired.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                    Please request a new reset link.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                  >
                    Request New Link
                  </Link>
                </motion.div>
              ) : (
                <>
                  <div className="lg:hidden mb-5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your new password</p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
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
                      {errors.password && (
                        <p className="text-danger text-xs mt-1.5">{errors.password.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          {...register('confirmPassword')}
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          className="w-full px-4 py-3.5 pl-12 pr-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                          {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-danger text-xs mt-1.5">{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                    </button>
                  </form>

                  <div className="text-center mt-6">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary dark:text-gray-400 transition-colors font-medium"
                    >
                      <ArrowLeft /> Back to Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default ResetPasswordPage