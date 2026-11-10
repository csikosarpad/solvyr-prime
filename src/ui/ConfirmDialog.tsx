import { useEffect, useId, useRef } from "react";
import "./ConfirmDialog.css";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  /** A visszafordíthatatlan műveletek (pl. mentés törlése) piros megerősítő gombot kapnak. */
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Játékstílusú modális megerősítés a böngésző confirm() helyett; Esc és a Mégse gomb is elvet. */
export function ConfirmDialog({
  title,
  message,
  cancelLabel,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={destructive ? "confirm-dialog confirm-dialog-destructive" : "confirm-dialog"}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-message`}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onKeyDown={(event) => {
        // A natív cancel esemény nem minden böngészőben/automatizálásban érkezik meg; Esc-et magunk kezeljük.
        if (event.key !== "Escape") return;
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-message`}>{message}</p>
      <div className="confirm-dialog-actions">
        <button className="btn secondary" autoFocus onClick={onCancel}>
          {cancelLabel}
        </button>
        <button className={destructive ? "btn danger" : "btn"} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
