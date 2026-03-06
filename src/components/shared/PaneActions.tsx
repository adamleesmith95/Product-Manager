import React from "react";

type Props = {
  onNew?: () => void;
  onClone?: () => void;
};

export default function PaneActions({ onNew, onClone }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button className="btn btn-light" onClick={onNew}>New</button>
      <button className="btn btn-light" onClick={onClone}>Clone</button>
    </div>
  );
}