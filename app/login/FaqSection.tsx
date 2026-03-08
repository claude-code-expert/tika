'use client';

import { useState, useEffect } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

export function FaqSection() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('/data/faq.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: FaqItem[]) => setItems(data))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mx-auto mt-9 flex max-w-[640px] flex-col gap-2.5">
      {items.map((item, i) => (
        <div key={i} className="overflow-hidden rounded-[10px] border border-[#DFE1E6] bg-white">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 border-none bg-transparent px-5 py-4 text-left text-sm font-semibold text-[#2C3E50]"
            style={{ fontFamily: 'inherit' }}
          >
            {item.q}
            <span
              className="shrink-0 text-lg text-[#8993A4] transition-transform duration-200"
              style={{ transform: openIndex === i ? 'rotate(45deg)' : undefined }}
            >
              +
            </span>
          </button>
          <div
            className="overflow-hidden text-[13px] leading-[1.7] text-[#5A6B7F] transition-all duration-200"
            style={{
              maxHeight: openIndex === i ? 200 : 0,
              padding: openIndex === i ? '0 20px 16px' : '0 20px',
              textAlign: 'left',
            }}
          >
            {item.a}
          </div>
        </div>
      ))}
    </div>
  );
}
