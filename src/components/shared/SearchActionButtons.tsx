import React from 'react';

interface Props {
  /** Set to false for views that don't support Clone (e.g. Display Group). Defaults to true. */
  includeClone?: boolean;
}

/**
 * Standard right-side action buttons shared across all Search panels.
 * Rendered inside SearchToolbar's `rightActions` prop (or ProductHeaderSearch's button row).
 */
export default function SearchActionButtons({ includeClone = true }: Props) {
  return (
    <>
      <button className="btn btn-light">Upload</button>
      <button className="btn btn-light">Export</button>
      {includeClone && <button className="btn btn-light">Clone</button>}
      <button className="btn btn-light">Unlock</button>
      <button className="btn btn-light">New</button>
    </>
  );
}
