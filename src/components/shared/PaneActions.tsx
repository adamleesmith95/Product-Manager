import React from "react";

interface PaneActionsProps {
  onNew?: () => void;
  onClone?: () => void;
  newLabel?: string;   // ADD
  cloneLabel?: string; // ADD
}

export default function PaneActions({
  onNew,
  onClone,
  newLabel = "New",       // ADD
  cloneLabel = "Clone",   // ADD
}: PaneActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button className="btn btn-light" onClick={onNew}>
        {newLabel}
      </button>
      <button className="btn btn-light" onClick={onClone}>
        {cloneLabel}
      </button>
    </div>
  );
}