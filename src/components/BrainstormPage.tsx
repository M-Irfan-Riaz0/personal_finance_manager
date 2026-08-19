"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { IconMaximize, IconMinimize } from "@/components/ui";

const Excalidraw = dynamic(async () => (await import("@excalidraw/excalidraw")).Excalidraw, {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-zinc-400">Loading canvas…</div>,
});

export default function BrainstormPage({
  elements,
  onElementsChange,
}: {
  elements: readonly ExcalidrawElement[];
  onElementsChange: (elements: readonly ExcalidrawElement[]) => void;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(nextElements: readonly ExcalidrawElement[]) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => onElementsChange(nextElements), 800);
  }

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-white p-3" : "relative -mx-8"}>
      <button
        onClick={() => setFullscreen((v) => !v)}
        title={fullscreen ? "Exit full width" : "Full width"}
        className="absolute right-3 top-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 shadow-2xs hover:bg-zinc-50"
      >
        {fullscreen ? <IconMinimize className="h-3.5 w-3.5" /> : <IconMaximize className="h-3.5 w-3.5" />}
        {fullscreen ? "Exit full width" : "Full width"}
      </button>

      <div
        className={
          fullscreen
            ? "h-full overflow-hidden rounded-md border border-zinc-300"
            : "h-[calc(100vh-170px)] min-h-[500px] overflow-hidden border-y border-zinc-300 bg-white shadow-2xs"
        }
      >
        <Excalidraw
          initialData={{ elements: elements as ExcalidrawElement[] }}
          onChange={(els) => handleChange(els)}
        />
      </div>
    </div>
  );
}
