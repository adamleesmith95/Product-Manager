import React, { useEffect, useState } from 'react';

interface Props {
  onCodeSearch: (code: string) => void;
  onDescSearch: (desc: string) => void;
  onClear: () => void;
  hasActiveSearch: boolean;
  codePlaceholder?: string;
  descPlaceholder?: string;
  codeClassName?: string;
}

export default function PaneSearchBar({
  onCodeSearch,
  onDescSearch,
  onClear,
  hasActiveSearch,
  codePlaceholder = 'Code',
  descPlaceholder = 'Description',
  codeClassName = 'w-20',
}: Props) {
  const [inputs, setInputs] = useState({ code: '', desc: '' });

  // When parent clears the active search, reset our draft inputs
  useEffect(() => {
    if (!hasActiveSearch) setInputs({ code: '', desc: '' });
  }, [hasActiveSearch]);

  function go() {
    if (inputs.code.trim()) onCodeSearch(inputs.code.trim());
    else if (inputs.desc.trim()) onDescSearch(inputs.desc.trim());
  }

  return (
    <div className="flex gap-1">
      <input
        type="text"
        placeholder={codePlaceholder}
        value={inputs.code}
        onChange={e => setInputs({ code: e.target.value, desc: '' })}
        onKeyDown={e => e.key === 'Enter' && go()}
        className={`${codeClassName} h-7 px-2 text-xs border rounded`}
      />
      <input
        type="text"
        placeholder={descPlaceholder}
        value={inputs.desc}
        onChange={e => setInputs({ code: '', desc: e.target.value })}
        onKeyDown={e => e.key === 'Enter' && go()}
        className="flex-1 h-7 px-2 text-xs border rounded min-w-0"
      />
      <button
        type="button"
        onClick={go}
        className="h-7 px-2 text-xs border rounded bg-gray-50 hover:bg-gray-100"
      >Go</button>
      {hasActiveSearch && (
        <button
          type="button"
          onClick={onClear}
          className="h-7 px-2 text-xs border rounded bg-gray-50 hover:bg-gray-100"
        >✕</button>
      )}
    </div>
  );
}