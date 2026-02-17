
// src/components/Modal.tsx
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

type ModalProps = {
  /** When true, mounts the modal */
  open: boolean;
  /** Close callback (ESC, backdrop, or Close button) */
  onClose: () => void;
  /** Optional heading; can be string or JSX node */
  title?: React.ReactNode;
  /** Your content (detail component) */
  children: React.ReactNode;

  /**
   * If provided, we will portal into this container instead of #modal-root/body.
   * This lets us cover a specific region (e.g., the Product Header surface).
   */
  containerId?: string;

  /**
   * When true and containerId is provided, overlay uses absolute positioning
   * with `inset-0` to cover the container exactly (not the whole viewport).
   * When false (or no containerId), overlay is full-screen (fixed inset-0).
   */
  coverContainer?: boolean;

  /** For centered variant (when not covering container), you can still control width */
  maxWidthClass?: string; // e.g., 'max-w-6xl'
  /** Visual style: 'centered' (default) or 'full' */
  variant?: 'centered' | 'full';

  /** NEW: Customize the header container (bg, padding, borders, etc.) */
  headerClassName?: string;
  /** NEW: Customize only the title text */
  titleClassName?: string;

  /** OPTIONAL: expose Save button & handler (kept simple; wire to form outside if needed) */
  showSaveButton?: boolean;
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  closeLabel?: string;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  containerId,
  coverContainer = false,
  maxWidthClass = 'max-w-6xl',
  variant = 'centered',

  headerClassName = '',
  titleClassName = '',

  showSaveButton = true,
  onSave,
  saveDisabled = false,
  saveLabel = 'Save',
  closeLabel = '✕',
}: ModalProps) {
  const containerEl =
    (containerId ? document.getElementById(containerId) : null) ||
    document.getElementById('modal-root') ||
    document.body;

  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus panel on open
  useEffect(() => {
    if (open && panelRef.current) panelRef.current.focus();
  }, [open]);

  // Body scroll lock only when we are full-screen; if we cover a container,
  // we’ll let the outside continue scrolling if needed.
  useEffect(() => {
    if (!open || (containerId && coverContainer)) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open, containerId, coverContainer]);

  if (!open) return null;

  // Positioning: full-screen if no container cover is requested;
  // else we cover the container (absolute inset-0).
  const outerClass =
    containerId && coverContainer
      ? 'absolute inset-0 z-[999]' // within the container
      : 'fixed inset-0 z-[9999]';  // full viewport

  const isFull = variant === 'full';

  const content = (
    <div aria-modal="true" role="dialog" className={`${outerClass} flex items-center justify-center`}>
      {/* Backdrop covers the same region as the modal (container or viewport) */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={
          isFull
            ? // Full-bleed panel fills the region completely
              'relative z-10 w-full h-full outline-none flex'
            : // Centered panel with max width & scrollable body
              `relative z-10 w-[96vw] ${maxWidthClass} max-h-[92vh] outline-none`
        }
      >
        <div
          className={
            isFull
              ? 'bg-white shadow-xl border flex-1 flex flex-col'
              : 'bg-white shadow-xl rounded border flex flex-col max-h-[92vh]'
          }
        >
          {/* Header */}
          <div
            className={
              // Default: indigo header like your screenshot; you can override via headerClassName.
              `px-4 py-3 border-b bg-indigo-950 flex items-center justify-between ${headerClassName}`
            }
          >
            {/* Title supports string or JSX. If it's a string, we apply titleClassName; JSX is rendered as-is. */}
            <div className="min-w-0 flex-1">
              {typeof title === 'string' ? (
                <div className={`font-semibold truncate ${titleClassName}`}>{title || 'Detail'}</div>
              ) : (
                <div className="font-semibold truncate">{title ?? 'Detail'}</div>
              )}
            </div>

            <div className="flex items-center gap-2 pl-3 shrink-0">
              {showSaveButton && (
                <button
                  className={`px-4 py-2 text-sm font-normal transition
                  border border-transparent rounded-sm
                  text-neutral-950
                  bg-white
                  hover:bg-neutral-200
                  focus:outline-none
                  aria-selected:bg-neutral-200
                  aria-selected:shadow-md
                  aria-selected:text-neutral-950
                  aria-selected:font-bold
                  focus:bg-neutral-300 disabled:cursor-not-allowed`}
                  onClick={onSave ?? onClose /* fallback no-op to onClose if no handler */}
                  disabled={saveDisabled}
                  aria-label="Save"
                >
                  {saveLabel}
                </button>
              )}

              <button
                className="px-2 py-2 text-sm font-normal transition
                  border border-transparent rounded-sm
                  text-neutral-950
                  bg-white
                  hover:bg-neutral-200
                  focus:outline-none
                  aria-selected:bg-neutral-200
                  aria-selected:shadow-md
                  aria-selected:text-neutral-950
                  aria-selected:font-bold
                  focus:bg-neutral-300 disabled:cursor-not-allowed"
                onClick={onClose}
                aria-label="Close"
                title="Close"
              >
                {closeLabel}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className={isFull ? 'p-4 overflow-auto flex-1' : 'p-4 overflow-auto'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, containerEl);
}
