import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, Loader2, Sun, Moon, Shield, CheckCircle } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import api from '../../services/api.js'
import toast from 'react-hot-toast'
import Logo from '../../components/ui/Logo.jsx'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotSchema) })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await api.post('/auth/forgot-password', data)
      setSent(true)
      toast.success('Reset link sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link')
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    'Enter your registered email address',
    'We will send you a password reset link',
    'Link expires in 30 minutes',
    'Follow the link to set a new password',
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
          <h1 className="text-4xl font-bold mb-3 text-center">Forgot Password?</h1>
          <p className="text-lg text-white/80 mb-10 text-center max-w-md">
            No worries! We will help you reset it.
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
            <span>Your data is safe and secure</span>
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
              {sent ? 'Check Your Email' : 'Reset Password'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {sent ? 'We have sent a reset link to your email' : 'Enter your email to receive a reset link'}
            </p>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border overflow-hidden">
            <div className="p-5 sm:p-6 lg:p-7">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>

                  <div className="lg:hidden mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Check Your Email</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">We have sent a reset link</p>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    If an account exists with that email, we have sent a password reset link.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                    Didn't receive it? Check your spam folder or try again.
                  </p>

                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                  </Link>
                </motion.div>
              ) : (
                <>
                  <div className="lg:hidden mb-5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your email to receive a reset link</p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          {...register('email')}
                          type="email"
                          placeholder="Enter your registered email"
                          className="w-full px-4 py-3.5 pl-12 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      {errors.email && (
                        <p className="text-danger text-xs mt-1.5">{errors.email.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                    </button>
                  </form>

                  <div className="text-center mt-6">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary dark:text-gray-400 transition-colors font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Login
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

export default ForgotPasswordPage