import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/helpers'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm text-liaotao-text-secondary mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-3 py-2 text-sm bg-liaotao-bg-tertiary border rounded-lg text-liaotao-text-primary transition-colors appearance-none',
            'focus:border-liaotao-accent focus:ring-1 focus:ring-liaotao-accent focus:outline-none',
            error && 'border-liaotao-error focus:border-liaotao-error',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-liaotao-error">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'