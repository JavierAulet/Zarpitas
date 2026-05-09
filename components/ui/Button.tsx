'use client'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type ButtonVariant = 'primary' | 'secondary' | 'green' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  children: React.ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-orange text-white font-bold shadow-orange hover:shadow-orange-lg',
  secondary:
    'bg-white border-2 border-orange text-orange font-bold hover:bg-orange-50',
  green:
    'bg-gradient-green text-white font-bold shadow-green',
  ghost:
    'text-text-secondary hover:text-text-primary font-medium',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-5 py-2.5 text-sm',
  md: 'px-7 py-3.5 text-sm',
  lg: 'px-9 py-4 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.03, y: disabled || loading ? 0 : -1 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      disabled={disabled || loading}
      className={twMerge(
        clsx(
          'rounded-full transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer select-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          (disabled || loading) && 'opacity-60 cursor-not-allowed',
          className
        )
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Procesando...
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}
