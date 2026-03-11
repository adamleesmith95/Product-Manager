import React from 'react';

interface Props {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export default function ModalTabButton({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        'px-4 py-2 text-sm transition',
        'focus:outline-none',
        'hover:bg-neutral-100 hover:text-neutral-950',
        active
          ? 'border-b-2 border-indigo-700 font-semibold text-indigo-950'
          : 'border-b-2 border-transparent font-normal text-neutral-700',
      ].join(' ')}
    >
      {children}
    </button>
  );
}