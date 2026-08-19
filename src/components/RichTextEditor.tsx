"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";
import { IconMaximize, IconMinimize } from "@/components/ui";

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`cursor-pointer rounded-sm px-2 py-1 text-xs font-semibold transition-colors ${
        active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  fullscreen,
  onToggleFullscreen,
}: {
  editor: Editor;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-1.5 py-1">
      <ToolbarButton
        title="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        P
      </ToolbarButton>
      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-zinc-300" />

      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <span className="line-through">S</span>
      </ToolbarButton>
      <ToolbarButton title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        {"</>"}
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-zinc-300" />

      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        title="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        &ldquo; Quote
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-zinc-300" />

      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolbarButton>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggleFullscreen}
        title={fullscreen ? "Exit full width" : "Full width"}
        className="ml-auto flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
      >
        {fullscreen ? <IconMinimize className="h-3.5 w-3.5" /> : <IconMaximize className="h-3.5 w-3.5" />}
        {fullscreen ? "Exit full width" : "Full width"}
      </button>
    </div>
  );
}

export default function RichTextEditor({
  value,
  onSave,
  placeholder,
}: {
  value: string;
  onSave: (html: string) => void;
  placeholder?: string;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rte-content min-h-[120px] px-3 py-2 text-sm text-zinc-700 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onSave(html), 500);
    },
  });

  // Keep the editor's content in sync if the underlying value changes externally
  // (e.g. switching between chapters), without fighting the user mid-edit.
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    if (editor.isFocused) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return <div className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-400">Loading editor…</div>;
  }

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-white p-3" : ""}>
      <div
        className={
          fullscreen
            ? "flex flex-1 flex-col overflow-hidden rounded-sm border border-zinc-300 bg-white"
            : "overflow-hidden rounded-sm border border-zinc-300 bg-white"
        }
      >
        <Toolbar editor={editor} fullscreen={fullscreen} onToggleFullscreen={() => setFullscreen((v) => !v)} />
        <EditorContent editor={editor} placeholder={placeholder} className={fullscreen ? "flex-1 overflow-y-auto" : ""} />
      </div>
    </div>
  );
}
