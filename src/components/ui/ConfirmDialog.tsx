import { motion } from 'framer-motion';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <motion.div
        className="modal-panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="modal-header">
          <h2 id="confirm-title">{title}</h2>
        </div>
        <div className="modal-body">
          <p>{description}</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="button button-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="button button-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
