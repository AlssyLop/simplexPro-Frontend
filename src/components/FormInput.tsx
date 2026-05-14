import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId ?? generatedId

    return (
      <div className={`form-field ${className}`}>
        {label && <label htmlFor={id}>{label}</label>}
        <input
          id={id}
          ref={ref}
          className={error ? 'is-invalid' : ''}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <div id={`${id}-error`} className="error-message" role="alert">
            {error}
          </div>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
