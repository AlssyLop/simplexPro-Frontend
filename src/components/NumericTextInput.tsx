import { useRef, useCallback } from 'react'
import type { KeyboardEvent, ChangeEvent } from 'react'
import { FormInput } from './FormInput'

export interface NumericTextInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  showInvalid?: boolean
  placeholder?: string
}

export function NumericTextInput({ value, onChange, ...rest }: NumericTextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return

    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
    if (controlKeys.includes(e.key)) return

    if (e.key.length !== 1) return

    const cursorPos = inputRef.current?.selectionStart ?? 0

    if (/^[0-9]$/.test(e.key)) return

    if (e.key === '-') {
      if (cursorPos === 0 && !value.startsWith('-')) return
      e.preventDefault()
      return
    }

    if (e.key === '.' || e.key === ',') {
      const hasDot = value.includes('.')
      const hasComma = value.includes(',')

      if ((e.key === '.' && hasComma) || (e.key === ',' && hasDot)) {
        e.preventDefault()
        onChange('')
        return
      }

      if ((e.key === '.' && hasDot) || (e.key === ',' && hasComma)) {
        e.preventDefault()
        return
      }

      if (cursorPos === 0 || value === '' || (value === '-' && cursorPos === 1)) {
        e.preventDefault()
        return
      }

      return
    }

    e.preventDefault()
  }, [value, onChange])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value

    if (raw === '' || raw === '-') {
      onChange(raw)
      return
    }

    let cleaned = raw.replace(/[^0-9.,-]/g, '')

    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = ''
    }

    if (cleaned.startsWith('.') || cleaned.startsWith(',')) {
      cleaned = ''
    }

    const minusCount = (cleaned.match(/-/g) || []).length
    if (minusCount > 1 || (minusCount === 1 && !cleaned.startsWith('-'))) {
      cleaned = ''
    }

    if ((cleaned.match(/\./g) || []).length > 1 || (cleaned.match(/,/g) || []).length > 1) {
      cleaned = ''
    }

    onChange(cleaned)
  }, [onChange])

  const handleRef = useCallback((el: HTMLInputElement | null) => {
    (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el
  }, [])

  return (
    <FormInput
      ref={handleRef}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      autoComplete="off"
      {...rest}
    />
  )
}
