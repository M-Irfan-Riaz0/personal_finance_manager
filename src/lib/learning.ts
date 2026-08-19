export type LearningType = "course" | "book" | "skill";
export type LearningStatus = "planned" | "in_progress" | "done";

export type VideoLink = {
  id: string;
  title: string;
  url: string;
};

export type ChapterNote = {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
};

export type LearningItem = {
  id: string;
  title: string;
  type: LearningType;
  status: LearningStatus;
  progress: number; // 0-100
  notes: string;
  link: string;
  video_links?: VideoLink[];
  chapters?: ChapterNote[];
  created_at: string;
};

export const STATUS_LABEL: Record<LearningStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
};

export type LearningFile = {
  id: string;
  learning_item_id: string;
  file_name: string;
  storage_path: string;
  created_at: string;
};

export const LEARNING_FILES_BUCKET = "learning-files";
