import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string | number
  label: string
}

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId ?? generatedId

    return (
      <div className={`form-field ${className}`}>
        {label && <label htmlFor={id}>{label}</label>}
        <select
          id={id}
          ref={ref}
          className={error ? 'is-invalid' : ''}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <div id={`${id}-error`} className="error-message" role="alert">
            {error}
          </div>
        )}
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'
