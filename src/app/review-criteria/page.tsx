"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { CriteriaEditor } from "@/components/CriteriaEditor";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PageHeader } from "@/components/PageHeader";
import { refineJobDescription } from "@/lib/api";
import { useRecruitingStore } from "@/store/recruiting-store";
import type { Criteria, UserComment } from "@/types";

const emptyCriteria: Criteria = {
  mustHave: [],
  nice2Have: [],
  redFlags: [],
};

export default function ReviewCriteriaPage() {
  const router = useRouter();
  const {
    rawJD,
    criteria,
    refinedJD,
    idealCandidateProfile,
    updateCriteria,
    setJobRefinement,
  } = useRecruitingStore();
  const [draft, setDraft] = useState<Criteria>(criteria ?? emptyCriteria);
  const [error, setError] = useState("");

  const [comments, setComments] = useState<UserComment[]>([]);
  const [activeSelection, setActiveSelection] = useState<string>("");
  const [draftInstruction, setDraftInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // Ref and State for Demo
  const jdContainerRef = useRef<HTMLDivElement | null>(null);
  const [demoState, setDemoState] = useState<{
    isRunning: boolean;
    step: 'none' | 'find-unknown' | 'scroll-to-text' | 'move-to-text' | 'selecting' | 'typing' | 'move-to-add' | 'completed';
    cursorX: number;
    cursorY: number;
    cursorVisible: boolean;
    tooltipText: string;
  }>({
    isRunning: false,
    step: 'none',
    cursorX: 0,
    cursorY: 0,
    cursorVisible: false,
    tooltipText: '',
  });

  useEffect(() => {
    return () => {
      window.getSelection()?.removeAllRanges();
    };
  }, []);

  if (!criteria || !rawJD) {
    return (
      <EmptyState
        title="No headlines to review yet"
        description="Refine a job description first so the assistant can produce structured must-haves, nice-to-haves, and red flags."
        actionHref="/upload-jd"
        actionLabel="Upload job description"
      />
    );
  }

  function handleConfirm() {
    const cleanedCriteria = cleanCriteria(draft);

    if (
      cleanedCriteria.mustHave.length === 0 &&
      cleanedCriteria.nice2Have.length === 0 &&
      cleanedCriteria.redFlags.length === 0
    ) {
      setError("Keep at least one criterion before moving to resume upload.");
      return;
    }

    updateCriteria(cleanedCriteria);
    router.push("/upload-resumes");
  }

  function captureSelection() {
    if (demoState.isRunning) return; // Prevent user interaction during demo
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      setActiveSelection(selection);
    }
  }

  function handleAddComment() {
    if (!draftInstruction.trim() || !activeSelection) return;
    setComments([...comments, { selectedText: activeSelection, instruction: draftInstruction.trim() }]);
    setDraftInstruction("");
    setActiveSelection("");
    window.getSelection()?.removeAllRanges();
  }

  function handleCancelComment() {
    setDraftInstruction("");
    setActiveSelection("");
    window.getSelection()?.removeAllRanges();
  }

  function removeComment(index: number) {
    setComments(comments.filter((_, i) => i !== index));
  }

  async function handleRefine() {
    if (comments.length === 0) return;
    setIsRefining(true);
    setError("");

    try {
      const response = await refineJobDescription({
        rawJD,
        previousRefinedJD: refinedJD,
        userComments: comments,
      });

      setJobRefinement({
        rawJD,
        refinedJD: response.refinedJD,
        criteria: response.criteria,
        idealCandidateProfile: response.idealCandidateProfile,
      });
      setComments([]);
      setDraft(response.criteria);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The Job Description refinement service did not respond."
      );
    } finally {
      setIsRefining(false);
    }
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  function findBracketedTextNode(container: HTMLElement) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let node;
    const regex = /\[Unknown:[^\]]+\]/i;
    
    while ((node = walker.nextNode())) {
      const text = node.nodeValue || "";
      const match = text.match(regex);
      if (match && match.index !== undefined) {
        return {
          node,
          text: match[0],
          index: match.index,
        };
      }
    }
    
    // Fallback: search for any bracketed text
    walker.currentNode = container; // reset walker
    const fallbackRegex = /\[[^\]]+\]/;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue || "";
      const match = text.match(fallbackRegex);
      if (match && match.index !== undefined) {
        return {
          node,
          text: match[0],
          index: match.index,
        };
      }
    }

    // Double fallback: search for "React", "Node.js", or "PostgreSQL"
    const words = ["React", "Node.js", "PostgreSQL", "Full Stack", "Solutions"];
    for (const word of words) {
      walker.currentNode = container; // reset
      while ((node = walker.nextNode())) {
        const text = node.nodeValue || "";
        const index = text.toLowerCase().indexOf(word.toLowerCase());
        if (index !== -1) {
          return {
            node,
            text: text.substring(index, index + word.length),
            index,
          };
        }
      }
    }

    return null;
  }

  async function startDemo() {
    if (!jdContainerRef.current) return;
    
    // Clear selection and comments to avoid conflicts
    window.getSelection()?.removeAllRanges();
    setActiveSelection("");
    setDraftInstruction("");
    
    // Initialize demo state at center of the viewport
    setDemoState({
      isRunning: true,
      step: 'find-unknown',
      cursorX: window.innerWidth / 2,
      cursorY: window.innerHeight / 2,
      cursorVisible: true,
      tooltipText: "Let's find some missing info to refine...",
    });
    
    await sleep(1500);

    const target = findBracketedTextNode(jdContainerRef.current);
    if (!target) {
      setDemoState(prev => ({
        ...prev,
        tooltipText: "No text found to annotate. Highlight manually instead!",
        step: 'completed',
      }));
      await sleep(2000);
      setDemoState(prev => ({ ...prev, isRunning: false, cursorVisible: false }));
      return;
    }

    // Scroll target into view if needed
    target.node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(800);

    // Create a temporary range to find the layout coordinates of the text
    const range = document.createRange();
    range.setStart(target.node, target.index);
    range.setEnd(target.node, target.index + target.text.length);
    
    const rects = range.getClientRects();
    const rect = rects[0] || range.getBoundingClientRect();
    
    const startX = rect.left;
    const startY = rect.top + rect.height / 2;
    const endX = rect.right;
    const endY = rect.top + rect.height / 2;

    // Move cursor to start of text
    setDemoState(prev => ({
      ...prev,
      step: 'move-to-text',
      cursorX: startX - 10,
      cursorY: startY,
      tooltipText: `First, let's highlight this part: "${target.text}"`,
    }));

    await sleep(1200);

    // Drag to select
    setDemoState(prev => ({
      ...prev,
      step: 'selecting',
      cursorX: endX,
      cursorY: endY,
      tooltipText: `Selecting text...`,
    }));

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    setActiveSelection(target.text);

    await sleep(1500);

    // Find annotation box
    const inputElement = document.querySelector('textarea[placeholder*="What should be changed?"]') as HTMLTextAreaElement;
    let inputRect = { left: window.innerWidth - 300, top: 400 };
    if (inputElement) {
      const r = inputElement.getBoundingClientRect();
      inputRect = { left: r.left + 30, top: r.top + 30 };
    }

    setDemoState(prev => ({
      ...prev,
      step: 'typing',
      cursorX: inputRect.left,
      cursorY: inputRect.top,
      tooltipText: "Now, let's write our instruction in the feedback box.",
    }));

    await sleep(1200);

    if (inputElement) {
      inputElement.focus();
    }

    const cleanText = target.text.replace(/\[Unknown:\s*/i, "").replace(/[\[\]]/g, "").trim();
    const cleanLower = cleanText.toLowerCase();
    let mockDetail = "required.";
    if (cleanLower.includes("cohort")) mockDetail = "2026/2027 graduates.";
    else if (cleanLower.includes("compensation") || cleanLower.includes("salary")) mockDetail = "$100k - $130k USD.";
    else if (cleanLower.includes("location")) mockDetail = "Remote (US/Canada).";
    else if (cleanLower.includes("employment")) mockDetail = "Full-time.";
    else if (cleanLower.includes("tech") || cleanLower.includes("stack") || cleanLower.includes("stack")) mockDetail = "React and Node.js.";
    else if (cleanLower.includes("experience")) mockDetail = "2+ years.";

    const instructionText = `Explain that ${cleanText} is ${mockDetail}`;
    for (let i = 1; i <= instructionText.length; i++) {
      setDraftInstruction(instructionText.slice(0, i));
      await sleep(40);
    }

    await sleep(800);

    // Find the Add Comment button
    let buttonRect = { left: window.innerWidth - 300, top: 550 };
    const buttons = document.querySelectorAll('button');
    let addButton: HTMLButtonElement | null = null;
    for (const btn of Array.from(buttons)) {
      if (btn.textContent?.includes('Add Comment')) {
        addButton = btn;
        const r = btn.getBoundingClientRect();
        buttonRect = { left: r.left + r.width / 2, top: r.top + r.height / 2 };
        break;
      }
    }

    setDemoState(prev => ({
      ...prev,
      step: 'move-to-add',
      cursorX: buttonRect.left,
      cursorY: buttonRect.top,
      tooltipText: "Clicking 'Add Comment'...",
    }));

    await sleep(1200);

    if (addButton) {
      // Simulate click visual effect
      addButton.classList.add('scale-95', 'opacity-80');
      await sleep(150);
      addButton.classList.remove('scale-95', 'opacity-80');
    }

    // Add comment
    setComments(prev => [
      ...prev,
      { selectedText: target.text, instruction: instructionText }
    ]);
    
    // Clear draft selection
    setDraftInstruction("");
    setActiveSelection("");
    window.getSelection()?.removeAllRanges();

    setDemoState(prev => ({
      ...prev,
      step: 'completed',
      cursorVisible: false,
      tooltipText: "Annotation added! You can add more, then click 'Refine with comments'!",
    }));

    await sleep(3000);

    setDemoState(prev => ({
      ...prev,
      isRunning: false,
      step: 'none',
    }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 2"
        title="Review hiring headlines"
        description="Edit the AI-refined headlines before they become the rubric used to rank resumes. Highlight any text in the Refined Job Description to add feedback and re-refine."
        actions={
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isRefining}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
          >
            Confirm headlines
          </button>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}

      {/* Feature Highlighting & Demo Banner */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100">
              💡
            </span>
            <div>
              <h3 className="text-sm font-semibold text-emerald-950">
                Refine Specific Parts with Highlighting
              </h3>
              <p className="mt-0.5 text-xs leading-5 text-emerald-800">
                Notice any missing information or placeholders like <code className="rounded bg-emerald-100 px-1 font-mono text-xs font-bold text-emerald-900 border border-emerald-200">[Unknown: ...]</code>? 
                Simply drag-select any text in the <strong>Refined Job Description</strong> to add custom feedback annotations and re-refine instantly!
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={demoState.isRunning}
            onClick={startDemo}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-emerald-700 shadow-sm border border-emerald-200 transition hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 disabled:opacity-50"
          >
            <span className="text-sm">🎥</span> Watch Demo Animation
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">Refined Job Description</h2>
            <div
              ref={jdContainerRef}
              className="mt-3 text-sm text-zinc-700 selection:bg-emerald-200 selection:text-emerald-900 cursor-text"
              onMouseUp={captureSelection}
            >
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-6 mb-3 text-zinc-900" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-5 mb-3 text-zinc-900" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-4 mb-2 text-zinc-900" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-4 leading-7" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="leading-7" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-semibold text-zinc-900" {...props} />,
                }}
              >
                {(refinedJD || "").replace(/\\n/g, '\n')}
              </ReactMarkdown>
            </div>
            {/* Guide for users */}
            <p className="mt-4 text-xs italic text-zinc-500">
              * Select any text above to add an instruction comment and re-refine the JD.
            </p>
          </div>
          
          <CriteriaEditor criteria={draft} onChange={setDraft} />
        </div>

        {/* Right Column */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">Ideal candidate profile</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-700">{idealCandidateProfile}</p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sticky top-6">
            <h2 className="text-lg font-semibold text-zinc-950 mb-3">Feedback annotations</h2>
            
            {activeSelection && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">
                  New Comment
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-700 line-clamp-3 italic">
                  &ldquo;{activeSelection}&rdquo;
                </p>
                <textarea
                  value={draftInstruction}
                  onChange={(e) => setDraftInstruction(e.target.value)}
                  placeholder="What should be changed? e.g. Make this sound more senior."
                  className="mt-3 min-h-[80px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!draftInstruction.trim()}
                    className="inline-flex min-h-8 flex-1 items-center justify-center rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                  >
                    Add Comment
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelComment}
                    className="inline-flex min-h-8 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {comments.length > 0 && (
              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                {comments.map((comment, index) => (
                  <div key={index} className="relative rounded-lg bg-zinc-50 p-3 pr-8 border border-zinc-100 animate-[pulse_1s_ease-in-out_1]">
                    <p className="text-xs leading-5 text-zinc-500 italic line-clamp-2">
                      &ldquo;{comment.selectedText}&rdquo;
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">
                      {comment.instruction}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeComment(index)}
                      className="absolute right-2 top-2 text-zinc-400 hover:text-rose-600"
                      aria-label="Remove comment"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!activeSelection && comments.length === 0 && (
              <p className="text-sm text-zinc-500 italic text-center py-4">
                Highlight text in the Job Description to add feedback annotations.
              </p>
            )}

            {comments.length > 0 && (
               <button
                 type="button"
                 onClick={handleRefine}
                 disabled={isRefining}
                 className="flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
               >
                 {isRefining ? "Applying changes..." : `Refine with ${comments.length} comment${comments.length > 1 ? "s" : ""}`}
               </button>
            )}
          </div>
        </aside>
      </section>

      {/* Simulated cursor layer */}
      {demoState.isRunning && demoState.cursorVisible && (
        <div
          style={{
            position: 'fixed',
            left: demoState.cursorX,
            top: demoState.cursorY,
            transform: 'translate(-4px, -4px)',
            transition: demoState.step === 'selecting' 
              ? 'left 1200ms linear, top 1200ms linear' 
              : 'left 1000ms cubic-bezier(0.25, 0.8, 0.25, 1), top 1000ms cubic-bezier(0.25, 0.8, 0.25, 1)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          className="flex flex-col items-start"
        >
          {/* Cursor SVG */}
          <svg
            className="h-6 w-6 text-emerald-600 drop-shadow-md filter"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M4.5 3v15.2l4.3-4.3 3 7.2 2.8-1.2-3-7.2h6.4L4.5 3z" />
          </svg>
          
          {/* Tooltip bubble next to the cursor */}
          <div 
            style={{
              transition: 'opacity 300ms ease-in-out',
              opacity: demoState.tooltipText ? 1 : 0,
            }}
            className="ml-4 mt-2 max-w-xs rounded-lg border border-emerald-100 bg-white p-2.5 text-xs font-semibold text-emerald-950 shadow-lg ring-1 ring-black/5 whitespace-nowrap"
          >
            <span className="mr-1">💡</span>
            {demoState.tooltipText}
          </div>
        </div>
      )}

      {/* Cancel Demo overlay button */}
      {demoState.isRunning && (
        <div className="fixed bottom-6 left-1/2 z-[9990] -translate-x-1/2 rounded-full border border-zinc-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur-sm flex items-center gap-3">
          <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
          <span className="text-xs font-semibold text-zinc-950">
            Playing Demo: {demoState.tooltipText || "Simulating interactive selection..."}
          </span>
          <button
            type="button"
            onClick={() => {
              setDemoState({
                isRunning: false,
                step: 'none',
                cursorX: 0,
                cursorY: 0,
                cursorVisible: false,
                tooltipText: '',
              });
              setActiveSelection("");
              setDraftInstruction("");
              window.getSelection()?.removeAllRanges();
            }}
            className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 transition"
          >
            Stop Demo
          </button>
        </div>
      )}
    </div>
  );
}

function cleanCriteria(criteria: Criteria): Criteria {
  return {
    mustHave: criteria.mustHave.map((item) => item.trim()).filter(Boolean),
    nice2Have: criteria.nice2Have.map((item) => item.trim()).filter(Boolean),
    redFlags: criteria.redFlags.map((item) => item.trim()).filter(Boolean),
  };
}
