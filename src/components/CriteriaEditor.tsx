"use client";

import { useState } from "react";
import type { Criteria, CriteriaKey } from "@/types";

const sections: Array<{
  key: CriteriaKey;
  title: string;
  description: string;
}> = [
  {
    key: "mustHave",
    title: "Must-have headlines",
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
  const [drafts, setDrafts] = useState<Partial<Record<CriteriaKey, string>>>({});
  const [isAdding, setIsAdding] = useState<Partial<Record<CriteriaKey, boolean>>>({});

  function updateItem(key: CriteriaKey, index: number, value: string) {
    const nextItems = criteria[key].map((item, itemIndex) =>
      itemIndex === index ? value : item,
    );
    onChange({ ...criteria, [key]: nextItems });
  }

  function removeItem(key: CriteriaKey, index: number) {
    const nextItems = criteria[key].filter((_, itemIndex) => itemIndex !== index);
    onChange({ ...criteria, [key]: nextItems });
  }

  function handleDraftChange(key: CriteriaKey, value: string) {
    setDrafts({ ...drafts, [key]: value });
  }

  function startAdding(key: CriteriaKey) {
    setIsAdding({ ...isAdding, [key]: true });
    setDrafts({ ...drafts, [key]: "" });
  }

  function cancelAdding(key: CriteriaKey) {
    setIsAdding({ ...isAdding, [key]: false });
    setDrafts({ ...drafts, [key]: "" });
  }

  function confirmAdding(key: CriteriaKey) {
    const text = drafts[key]?.trim();
    if (text) {
      onChange({ ...criteria, [key]: [...criteria[key], text] });
    }
    cancelAdding(key);
  }

  return (
    <div className="flex flex-col gap-6">
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
            
            {isAdding[section.key] && (
              <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <textarea
                  value={drafts[section.key] || ""}
                  onChange={(event) => handleDraftChange(section.key, event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      confirmAdding(section.key);
                    }
                  }}
                  autoFocus
                  rows={3}
                  placeholder={`New ${section.title.toLowerCase()}...`}
                  className="min-h-20 flex-1 resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => cancelAdding(section.key)}
                    className="min-h-8 rounded-lg border border-zinc-300 px-3 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmAdding(section.key)}
                    disabled={!drafts[section.key]?.trim()}
                    className="min-h-8 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {!isAdding[section.key] && (
            <button
              type="button"
              onClick={() => startAdding(section.key)}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              Add item
            </button>
          )}
        </section>
      ))}
    </div>
  );
}
