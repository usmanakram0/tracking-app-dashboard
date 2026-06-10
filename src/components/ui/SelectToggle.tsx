'use client';

import { CheckSquare, Square } from 'lucide-react';

type SelectToggleProps = {
  isSelected: boolean;
  onClick: () => void;
  label?: string;
};

export function SelectToggle({ isSelected, onClick, label }: SelectToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label || (isSelected ? 'Deselect item' : 'Select item')}
      className="mt-0.5 shrink-0 rounded-md p-1 text-slate-500 transition-colors duration-200 hover:bg-slate-800 hover:text-slate-300"
    >
      {isSelected ? (
        <CheckSquare className="h-4 w-4 text-emerald-400" />
      ) : (
        <Square className="h-4 w-4" />
      )}
    </button>
  );
}
