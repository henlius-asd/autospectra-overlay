import * as RadixAccordion from '@radix-ui/react-accordion';
import type { ReactNode } from 'react';
import { ChevronDownIcon } from './icons';

interface AccordionSection {
  id: string;
  title: string;
  content: ReactNode;
  defaultExpanded?: boolean;
}

interface AccordionProps {
  sections: AccordionSection[];
}

/**
 * Accordion primitive backed by Radix (type="multiple"): full ARIA
 * semantics, keyboard operable triggers, multi-panel expansion.
 * The `sections` API is unchanged from the hand-rolled version.
 * Height animation uses the --radix-accordion-content-height CSS variable.
 */
export default function Accordion({ sections }: AccordionProps) {
  const defaultValue = sections.filter((s) => s.defaultExpanded).map((s) => s.id);

  return (
    <RadixAccordion.Root type="multiple" defaultValue={defaultValue} className="flex flex-col">
      {sections.map((section) => (
        <RadixAccordion.Item key={section.id} value={section.id} className="border-b border-line">
          <RadixAccordion.Header className="flex">
            <RadixAccordion.Trigger className="group flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-hover">
              <span>{section.title}</span>
              <ChevronDownIcon className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <RadixAccordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="px-3 pb-3">{section.content}</div>
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}
