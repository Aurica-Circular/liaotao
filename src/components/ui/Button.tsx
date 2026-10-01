import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/helpers'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-liaotao-accent focus-visible:ring-offset-2 focus-visible:ring-offset-liaotao-bg-primary disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-liaotao-accent text-liaotao-bg-primary hover:bg-liaotao-accent-hover active:bg-liaotao-accent-active',
      secondary: 'bg-liaotao-bg-tertiary text-liaotao-text-primary hover:bg-liaotao-text-muted/20 active:bg-liaotao-text-muted/30',
      ghost: 'bg-transparent text-liaotao-text-secondary hover:bg-liaotao-bg-tertiary hover:text-liaotao-text-primary active:bg-liaotao-text-muted/20',
      danger: 'bg-liaotao-error/10 text-liaotao-error hover:bg-liaotao-error/20 active:bg-liaotao-error/30',
    }

    const sizes = {
      sm: 'px-2.5 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'