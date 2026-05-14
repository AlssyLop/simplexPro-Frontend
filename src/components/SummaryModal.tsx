import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  title: string
  children: ReactNode
}

export function SummaryModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  children,
}: SummaryModalProps) {
  
  // Cerrar con Escape si no está cargando
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={!isLoading ? onClose : undefined}>
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-header-title">{title}</h2>
          <button 
            type="button"
            className="modal-header-close" 
            onClick={onClose} 
            disabled={isLoading}
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
        
        <div className="modal-footer">
          <button 
            type="button"
            className="btn-secondary" 
            onClick={onClose} 
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button 
            type="button"
            className="btn-primary" 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? 'Calculando...' : 'Calcular'}
          </button>
        </div>
      </div>
    </div>
  )
}
