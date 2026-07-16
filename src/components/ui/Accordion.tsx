import { useState, type ReactNode } from 'react';
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

export default function Accordion({ sections }: AccordionProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const section of sections) {
      if (section.defaultExpanded) {
        initial.add(section.id);
      }
    }
    return initial;
  });

  const toggleSection = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col">
      {sections.map((section) => {
        const isOpen = expanded.has(section.id);
        return (
          <div key={section.id} className="border-b border-gray-200">
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <span>{section.title}</span>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && <div className="px-3 pb-3">{section.content}</div>}
          </div>
        );
      })}
    </div>
  );
}