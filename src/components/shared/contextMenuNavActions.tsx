import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { RowAction } from './RowContextMenu';

export function newTabLabel(text: string) {
  return (
    <span className="flex items-center gap-2">
      <span>{text}</span>
      <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-500" />
    </span>
  );
}

export function buildDualNavActions(args: {
  baseKey: string;
  sameTabLabel: string;
  newTabLabelText?: string;
  onSameTab: () => void;
  newTabUrl: string;
}): RowAction[] {
  const {
    baseKey,
    sameTabLabel,
    newTabLabelText = sameTabLabel,
    onSameTab,
    newTabUrl,
  } = args;

  return [
    {
      key: `${baseKey}-same`,
      label: sameTabLabel,
      onClick: onSameTab,
    },
    {
      key: `${baseKey}-new-tab`,
      label: newTabLabel(newTabLabelText),
      onClick: () => window.open(newTabUrl, '_blank'),
    },
  ];
}