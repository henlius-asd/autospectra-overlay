import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { CheckIcon, ChevronDownIcon } from './icons';

export interface DropdownItem {
  icon?: FC<{ className?: string }>;
  label: string;
  onClick?: () => void;
  checked?: boolean;
  danger?: boolean;
  disabled?: boolean;
  keepOpen?: boolean;
}

interface DropdownProps {
  label: string;
  icon?: FC<{ className?: string }>;
  items: DropdownItem[];
  disabled?: boolean;
}

export default function Dropdown({ label, icon: Icon, items, disabled }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, handleClickOutside, handleKeyDown]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-gray-200 text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        <ChevronDownIcon className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[160px]">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick?.();
                if (!item.keepOpen) {
                  setOpen(false);
                }
              }}
              disabled={item.disabled}
              className={`flex items-center gap-2 w-full text-left text-xs px-3 py-1.5 ${
                item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-100'
              } disabled:text-gray-300 disabled:cursor-not-allowed`}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              <span className="flex-1">{item.label}</span>
              {item.checked !== undefined && (
                <span className={`${item.checked ? 'text-blue-600' : 'text-transparent'}`}>
                  <CheckIcon className="w-4 h-4" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}