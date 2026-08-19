"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LEARNING_FILES_BUCKET,
  LearningFile,
  LearningItem,
  LearningStatus,
  LearningType,
  STATUS_LABEL,
} from "@/lib/learning";

function TypeIcon({ type }: { type: LearningType }) {
  if (type === "course") {
    return (
      <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    );
  }
  if (type === "book") {
    return (
      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const STATUS_COLOR: Record<LearningStatus, string> = {
  planned: "bg-zinc-100 text-zinc-600",
  in_progress: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

function NotesField({
  value,
  onSave,
}: {
  value: string;
  onSave: (next: string) => void;
}) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(next: string) {
    setText(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave(next), 500);
  }

  return (
    <textarea
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Notes for this course/book/skill..."
      rows={3}
      className="w-full resize-y rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function fileUrl(path: string) {
  const supabase = createClient();
  return supabase.storage.from(LEARNING_FILES_BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function LearningPage({
  items,
  files,
  onItemsChange,
  onFilesChange,
}: {
  items: LearningItem[];
  files: LearningFile[];
  onItemsChange: (items: LearningItem[]) => void;
  onFilesChange: (files: LearningFile[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<LearningType>("course");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("learning_items")
      .insert({ title: title.trim(), type })
      .select()
      .single();
    if (!error && data) {
      onItemsChange([...items, data as LearningItem]);
      setTitle("");
      setType("course");
    }
  }

  async function updateItem(id: string, patch: Partial<LearningItem>) {
    onItemsChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    const supabase = createClient();
    await supabase.from("learning_items").update(patch).eq("id", id);
  }

  async function removeItem(id: string) {
    onItemsChange(items.filter((i) => i.id !== id));
    onFilesChange(files.filter((f) => f.learning_item_id !== id));
    const supabase = createClient();
    await supabase.from("learning_items").delete().eq("id", id);
  }

  async function uploadFile(itemId: string, file: File) {
    if (file.type !== "application/pdf") {
      alert("Only PDF files are supported right now.");
      return;
    }
    setUploadingId(itemId);
    const supabase = createClient();
    const path = `${itemId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(LEARNING_FILES_BUCKET).upload(path, file);
    if (!uploadError) {
      const { data, error } = await supabase
        .from("learning_files")
        .insert({ learning_item_id: itemId, file_name: file.name, storage_path: path })
        .select()
        .single();
      if (!error && data) onFilesChange([...files, data as LearningFile]);
    }
    setUploadingId(null);
  }

  async function removeFile(file: LearningFile) {
    onFilesChange(files.filter((f) => f.id !== file.id));
    const supabase = createClient();
    await supabase.storage.from(LEARNING_FILES_BUCKET).remove([file.storage_path]);
    await supabase.from("learning_files").delete().eq("id", file.id);
  }

  return (
    <div>
      <form
        onSubmit={addItem}
        className="mb-6 flex flex-col gap-2 rounded-md border border-zinc-300 bg-white p-4 shadow-2xs sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-zinc-500">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Data Structures & Algorithms"
            className="rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LearningType)}
            className="rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="course">Course</option>
            <option value="book">Book</option>
            <option value="skill">Skill</option>
          </select>
        </label>
        <button
          type="submit"
          className="cursor-pointer rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add
        </button>
      </form>

      {items.length === 0 && (
        <p className="text-sm text-zinc-500">Nothing being learned yet. Add a course, book, or skill above.</p>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const itemFiles = files.filter((f) => f.learning_item_id === item.id);
          return (
            <div key={item.id} className="rounded-md border border-zinc-300 bg-white p-4 shadow-2xs">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TypeIcon type={item.type} />
                  <span className="text-sm font-semibold text-zinc-900">{item.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLOR[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.title}`}
                  className="cursor-pointer text-zinc-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>

              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <label className="flex items-center gap-1.5">
                  Progress
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={item.progress}
                    onChange={(e) => updateItem(item.id, { progress: Number(e.target.value) })}
                    className="w-28 cursor-pointer"
                  />
                  <span className="w-9 text-right font-medium text-zinc-700">{item.progress}%</span>
                </label>

                <select
                  value={item.status}
                  onChange={(e) => updateItem(item.id, { status: e.target.value as LearningStatus })}
                  className="cursor-pointer rounded-sm border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="mb-3">
                <p className="mb-1 text-xs font-medium text-zinc-500">Notes</p>
                <NotesField value={item.notes} onSave={(notes) => updateItem(item.id, { notes })} />
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-zinc-500">Files</p>
                <div className="space-y-1">
                  {itemFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-sm border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs"
                    >
                      <a
                        href={fileUrl(f.storage_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-indigo-700 hover:underline"
                      >
                        <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {f.file_name}
                      </a>
                      <button
                        onClick={() => removeFile(f)}
                        aria-label={`Remove ${f.file_name}`}
                        className="cursor-pointer text-zinc-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-dashed border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-indigo-400 hover:text-indigo-700">
                  {uploadingId === item.id ? "Uploading…" : "+ Attach PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    disabled={uploadingId === item.id}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(item.id, file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
