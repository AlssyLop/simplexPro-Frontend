import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  showInvalid?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, showInvalid, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId ?? generatedId
    const invalid = !!(error || showInvalid)

    return (
      <div className={`form-field ${className}`}>
        {label && <label htmlFor={id}>{label}</label>}
        <input
          id={id}
          ref={ref}
          className={invalid ? 'is-invalid' : ''}
          aria-invalid={invalid}
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
