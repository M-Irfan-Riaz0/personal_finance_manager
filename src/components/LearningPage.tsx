"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LEARNING_FILES_BUCKET,
  LearningFile,
  LearningItem,
  LearningStatus,
  LearningType,
  STATUS_LABEL,
  VideoLink,
  ChapterNote,
} from "@/lib/learning";
import { Panel, EmptyState, TextField, SelectField, PrimaryButton, IconRemoveButton, IconBook, IconVideo, IconFile, IconNotes } from "@/components/ui";
import RichTextEditor from "@/components/RichTextEditor";

function TypeIcon({ type }: { type: LearningType }) {
  if (type === "course") {
    return (
      <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
        />
      </svg>
    );
  }
  if (type === "book") {
    return (
      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const STATUS_COLOR: Record<LearningStatus, string> = {
  planned: "bg-zinc-100 text-zinc-600",
  in_progress: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

function fileUrl(path: string) {
  const supabase = createClient();
  return supabase.storage.from(LEARNING_FILES_BUCKET).getPublicUrl(path).data.publicUrl;
}

type DetailTab = "chapters" | "videos" | "files" | "overview";

const DETAIL_TABS: { id: DetailTab; label: string; Icon: typeof IconBook }[] = [
  { id: "chapters", label: "Chapters & Notes", Icon: IconBook },
  { id: "videos", label: "Videos & Links", Icon: IconVideo },
  { id: "files", label: "PDFs & Resources", Icon: IconFile },
  { id: "overview", label: "Overview Notes", Icon: IconNotes },
];

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
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | LearningType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | LearningStatus>("all");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Detail view state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("chapters");

  // Forms inside the detail view
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("learning_items")
      .insert({ title: title.trim(), type, video_links: [], chapters: [] })
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
    if (selectedId === id) {
      setSelectedId(null);
    }
  }

  // Video links management
  async function addVideoLink(item: LearningItem) {
    const vTitle = newVideoTitle.trim();
    const vUrl = newVideoUrl.trim();
    if (!vUrl) return;

    const newLink: VideoLink = {
      id: `v-${Date.now()}`,
      title: vTitle || "Video Resource",
      url: vUrl.startsWith("http") ? vUrl : `https://${vUrl}`,
    };

    const video_links = [...(item.video_links || []), newLink];
    updateItem(item.id, { video_links });
    setNewVideoTitle("");
    setNewVideoUrl("");
  }

  async function removeVideoLink(item: LearningItem, linkId: string) {
    const video_links = (item.video_links || []).filter((v) => v.id !== linkId);
    updateItem(item.id, { video_links });
  }

  // Chapters & Notes management
  async function addChapter(item: LearningItem) {
    const cTitle = newChapterTitle.trim();
    if (!cTitle) return;

    const newChapter: ChapterNote = {
      id: `c-${Date.now()}`,
      title: cTitle,
      notes: "",
      completed: false,
    };

    const chapters = [...(item.chapters || []), newChapter];
    const completedCount = chapters.filter((c) => c.completed).length;
    const progress = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

    updateItem(item.id, { chapters, progress });
    setNewChapterTitle("");
  }

  async function updateChapter(item: LearningItem, chapterId: string, patch: Partial<ChapterNote>) {
    const chapters = (item.chapters || []).map((c) => (c.id === chapterId ? { ...c, ...patch } : c));
    const completedCount = chapters.filter((c) => c.completed).length;
    const progress = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;
    const status: LearningStatus = progress === 100 ? "done" : progress > 0 ? "in_progress" : item.status;

    updateItem(item.id, { chapters, progress, status });
  }

  async function removeChapter(item: LearningItem, chapterId: string) {
    const chapters = (item.chapters || []).filter((c) => c.id !== chapterId);
    const completedCount = chapters.filter((c) => c.completed).length;
    const progress = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

    updateItem(item.id, { chapters, progress });
  }

  // File Upload
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

  // Search & Filters (grid view only)
  const filteredItems = items.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (!search.trim()) return true;

    const q = search.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(q);
    const notesMatch = item.notes.toLowerCase().includes(q);
    const videoMatch = (item.video_links || []).some((v) => v.title.toLowerCase().includes(q) || v.url.toLowerCase().includes(q));
    const chapterMatch = (item.chapters || []).some((c) => c.title.toLowerCase().includes(q) || c.notes.toLowerCase().includes(q));

    return titleMatch || notesMatch || videoMatch || chapterMatch;
  });

  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null;

  function openItem(id: string) {
    setSelectedId(id);
    setDetailTab("chapters");
  }

  // -------------------------------------------------------------------------
  // Detail view: a course/book/skill opened full-width with its own sub-nav
  // -------------------------------------------------------------------------
  if (selectedItem) {
    const itemFiles = files.filter((f) => f.learning_item_id === selectedItem.id);
    const vLinks = selectedItem.video_links || [];
    const chapters = selectedItem.chapters || [];

    return (
      <div>
        <button
          onClick={() => setSelectedId(null)}
          className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Learning
        </button>

        <Panel className="mb-4 p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <TypeIcon type={selectedItem.type} />
              <h1 className="text-lg font-bold text-zinc-900">{selectedItem.title}</h1>
              <select
                value={selectedItem.status}
                onChange={(e) => updateItem(selectedItem.id, { status: e.target.value as LearningStatus })}
                className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold border-0 outline-none ${STATUS_COLOR[selectedItem.status]}`}
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <IconRemoveButton onClick={() => removeItem(selectedItem.id)} label={`Remove ${selectedItem.title}`} />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Progress
                <span className="ml-1 text-zinc-400">
                  ({chapters.length === 0 ? "no chapters yet" : `${chapters.filter((c) => c.completed).length}/${chapters.length} chapters`})
                </span>
              </span>
              <span className="font-medium text-zinc-700">{selectedItem.progress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${selectedItem.progress}%` }}
              />
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          {/* Detail sub-nav — this item's own sidebar */}
          <Panel className="h-fit p-2">
            <nav className="flex flex-col gap-1">
              {DETAIL_TABS.map((t) => {
                const count =
                  t.id === "chapters" ? chapters.length : t.id === "videos" ? vLinks.length : t.id === "files" ? itemFiles.length : null;
                return (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                      detailTab === t.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <t.Icon className="h-4 w-4" />
                      {t.label}
                    </span>
                    {count !== null && (
                      <span
                        className={`rounded-full px-1.5 text-[11px] font-semibold ${
                          detailTab === t.id ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-600"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </Panel>

          {/* Detail content */}
          <Panel className="p-5">
            {detailTab === "chapters" && (
              <div className="space-y-4">
                {chapters.length === 0 && (
                  <p className="text-sm text-zinc-400">
                    No chapters added yet. Add chapter topics below to track notes and completion.
                  </p>
                )}

                <div className="space-y-3">
                  {chapters.map((chap) => (
                    <div
                      key={chap.id}
                      className={`rounded-md border p-3 ${
                        chap.completed ? "border-emerald-200 bg-emerald-50/30" : "border-zinc-200 bg-zinc-50/50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-800">
                          <input
                            type="checkbox"
                            checked={chap.completed}
                            onChange={(e) => updateChapter(selectedItem, chap.id, { completed: e.target.checked })}
                            className="h-4 w-4 rounded-xs text-indigo-600 cursor-pointer"
                          />
                          <span className={chap.completed ? "text-zinc-400 line-through" : ""}>{chap.title}</span>
                        </label>
                        <IconRemoveButton onClick={() => removeChapter(selectedItem, chap.id)} label={`Remove ${chap.title}`} />
                      </div>

                      <RichTextEditor
                        value={chap.notes}
                        placeholder={`Notes for ${chap.title}...`}
                        onSave={(notes) => updateChapter(selectedItem, chap.id, { notes })}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
                  <input
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="e.g. Chapter 1: System Architecture"
                    className="flex-1 rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500"
                  />
                  <PrimaryButton onClick={() => addChapter(selectedItem)}>+ Add Chapter</PrimaryButton>
                </div>
              </div>
            )}

            {detailTab === "videos" && (
              <div className="space-y-4">
                {vLinks.length === 0 && (
                  <p className="text-sm text-zinc-400">No video links added yet. Add YouTube, Vimeo, or documentation links below.</p>
                )}

                <div className="space-y-2">
                  {vLinks.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 p-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-800">{v.title}:</span>
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-medium text-indigo-700 hover:underline"
                        >
                          {v.url}
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <IconRemoveButton onClick={() => removeVideoLink(selectedItem, v.id)} label={`Remove ${v.title}`} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2 border-t border-zinc-100 pt-3 sm:grid-cols-3">
                  <input
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder="Video Title (e.g. Lecture 1)"
                    className="rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500"
                  />
                  <input
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="URL (e.g. https://youtube.com/...)"
                    className="rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500"
                  />
                  <PrimaryButton onClick={() => addVideoLink(selectedItem)}>+ Add Video Link</PrimaryButton>
                </div>
              </div>
            )}

            {detailTab === "files" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  {itemFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
                      <a
                        href={fileUrl(f.storage_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-medium text-indigo-700 hover:underline"
                      >
                        <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {f.file_name}
                      </a>
                      <IconRemoveButton onClick={() => removeFile(f)} label={`Remove ${f.file_name}`} />
                    </div>
                  ))}
                </div>

                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:border-indigo-400 hover:text-indigo-700">
                  {uploadingId === selectedItem.id ? "Uploading PDF…" : "+ Attach PDF Document"}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    disabled={uploadingId === selectedItem.id}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(selectedItem.id, file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            )}

            {detailTab === "overview" && (
              <RichTextEditor
                value={selectedItem.notes}
                placeholder="High-level course overview, key takeaways, or general reflections..."
                onSave={(notes) => updateItem(selectedItem.id, { notes })}
              />
            )}
          </Panel>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Grid view: compact cards, click one to open its detail view
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <Panel className="p-4">
        <form onSubmit={addItem} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField
              label="Course, Book, or Skill Name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next.js 16 Masterclass & System Design"
            />
          </div>
          <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value as LearningType)}>
            <option value="course">Course</option>
            <option value="book">Book</option>
            <option value="skill">Skill</option>
          </SelectField>
          <PrimaryButton type="submit">+ Add Resource</PrimaryButton>
        </form>
      </Panel>

      <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, chapters, notes, or video links..."
            className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-1.5 pl-8 text-xs outline-none focus:border-indigo-500"
          />
          <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "all" | LearningType)}
            className="rounded-sm border border-zinc-300 bg-white px-2 py-1 outline-none"
          >
            <option value="all">All Types</option>
            <option value="course">Courses</option>
            <option value="book">Books</option>
            <option value="skill">Skills</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "all" | LearningStatus)}
            className="rounded-sm border border-zinc-300 bg-white px-2 py-1 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="planned">Planned</option>
            <option value="done">Completed</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <EmptyState>No learning items found. Add a course, book, or skill above to get started.</EmptyState>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => {
          const itemFiles = files.filter((f) => f.learning_item_id === item.id);
          const vLinks = item.video_links || [];
          const chapters = item.chapters || [];

          return (
            <Panel key={item.id} className="p-0">
              <button onClick={() => openItem(item.id)} className="w-full cursor-pointer p-4 text-left">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TypeIcon type={item.type} />
                    <h2 className="text-sm font-bold text-zinc-900">{item.title}</h2>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>

                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${item.progress}%` }} />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <IconBook className="h-3 w-3" /> {chapters.length} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <IconVideo className="h-3 w-3" /> {vLinks.length} videos
                  </span>
                  <span className="flex items-center gap-1">
                    <IconFile className="h-3 w-3" /> {itemFiles.length} files
                  </span>
                  <span className="ml-auto font-medium text-zinc-700">{item.progress}%</span>
                </div>
              </button>
              <div className="flex justify-end border-t border-zinc-100 px-4 py-1.5">
                <IconRemoveButton onClick={() => removeItem(item.id)} label={`Remove ${item.title}`} />
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
