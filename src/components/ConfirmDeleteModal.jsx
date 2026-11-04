import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

export default function ConfirmDeleteModal({ open, title = "Delete item?", message, confirmLabel = "Delete", onConfirm, onCancel, busy = false }) {
  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onCancel, open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <button className="modal-close" type="button" aria-label="Close dialog" disabled={busy} onClick={onCancel}><X size={18} /></button>
        <div className="confirm-icon"><AlertTriangle size={22} /></div>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="button-secondary" type="button" disabled={busy} onClick={onCancel}>Cancel</button>
          <button className="button-danger" type="button" disabled={busy} onClick={onConfirm}>{busy ? "Deleting..." : confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
