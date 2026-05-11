"use client";

import type { Criteria, CriteriaKey } from "@/types";

const sections: Array<{
  key: CriteriaKey;
  title: string;
  description: string;
}> = [
  {
    key: "mustHave",
    title: "Must-have criteria",
    description: "Non-negotiable signals the candidate needs to show.",
  },
  {
    key: "nice2Have",
    title: "Nice-to-have signals",
    description: "Useful experience that can separate close candidates.",
  },
  {
    key: "redFlags",
    title: "Red flags",
    description: "Concerns that should lower confidence or trigger follow-up.",
  },
];

export function CriteriaEditor({
  criteria,
  onChange,
}: {
  criteria: Criteria;
  onChange: (criteria: Criteria) => void;
}) {
  function updateItem(key: CriteriaKey, index: number, value: string) {
    const nextItems = criteria[key].map((item, itemIndex) =>
      itemIndex === index ? value : item,
    );
    onChange({ ...criteria, [key]: nextItems });
  }

  function addItem(key: CriteriaKey) {
    onChange({ ...criteria, [key]: [...criteria[key], ""] });
  }

  function removeItem(key: CriteriaKey, index: number) {
    const nextItems = criteria[key].filter((_, itemIndex) => itemIndex !== index);
    onChange({ ...criteria, [key]: nextItems });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {sections.map((section) => (
        <section
          key={section.key}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <div className="min-h-20">
            <h2 className="text-lg font-semibold text-zinc-950">{section.title}</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">{section.description}</p>
          </div>
          <div className="mt-4 space-y-3">
            {criteria[section.key].map((item, index) => (
              <div key={`${section.key}-${index}`} className="flex items-start gap-2">
                <textarea
                  value={item}
                  onChange={(event) => updateItem(section.key, index, event.target.value)}
                  rows={3}
                  className="min-h-20 flex-1 resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  aria-label={`${section.title} item ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeItem(section.key, index)}
                  className="min-h-10 rounded-lg border border-zinc-300 px-3 text-sm font-semibold text-zinc-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                  aria-label={`Remove ${section.title} item ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addItem(section.key)}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
          >
            Add item
          </button>
        </section>
      ))}
    </div>
  );
}
