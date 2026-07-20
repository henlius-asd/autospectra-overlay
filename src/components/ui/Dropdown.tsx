import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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

/**
 * Menu primitive backed by Radix DropdownMenu: keyboard navigation,
 * typeahead, Escape/outside close and focus management out of the box.
 * The data-driven `items` API is unchanged from the hand-rolled version.
 */
export default function Dropdown({ label, icon: Icon, items, disabled }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-surface-active text-ink-muted disabled:text-line-strong disabled:cursor-not-allowed data-[state=open]:bg-surface-active"
        >
          {Icon && <Icon className="w-4 h-4" />}
          {label}
          <ChevronDownIcon className="w-3 h-3 transition-transform [[data-state=open]>&]:rotate-180" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="bg-surface-raised border border-line rounded-lg shadow-overlay z-50 min-w-[160px] py-1"
        >
          {items.map((item, i) => (
            <DropdownMenu.Item
              key={i}
              disabled={item.disabled}
              onSelect={(e) => {
                if (item.keepOpen) e.preventDefault();
                item.onClick?.();
              }}
              className={`flex items-center gap-2 w-full text-left text-xs px-3 py-1.5 outline-none cursor-pointer ${
                item.danger
                  ? 'text-danger data-[highlighted]:bg-danger-subtle'
                  : 'text-ink data-[highlighted]:bg-surface-hover'
              } data-[disabled]:text-line-strong data-[disabled]:cursor-not-allowed`}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              <span className="flex-1">{item.label}</span>
              {item.checked !== undefined && (
                <span className={`${item.checked ? 'text-accent-strong' : 'text-transparent'}`}>
                  <CheckIcon className="w-4 h-4" />
                </span>
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
