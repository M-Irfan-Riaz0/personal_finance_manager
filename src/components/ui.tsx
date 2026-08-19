"use client";

/**
 * Shared design-system primitives for every section (Finance, Todos, Habits,
 * Learning, Settings). New sections should build on these instead of
 * redefining their own card/table/input styling.
 */

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function Panel({
  children,
  className = "",
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-md border border-zinc-300 bg-white shadow-2xs ${className}`} {...props}>
      {children}
    </div>
  );
}

export function TableShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <Panel className={`overflow-x-auto ${className}`}>{children}</Panel>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold tracking-tight text-zinc-900">{children}</h2>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-zinc-300 bg-white px-3 py-4 text-center text-xs text-zinc-400">
      {children}
    </p>
  );
}

/** A bordered panel with a titled header bar, e.g. Settings' "Accounts" card. */
export function TitledPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel>
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </Panel>
  );
}

/** A stat tile used on Home and in section headers (e.g. Finance's summary cards). */
export function StatTile({
  label,
  value,
  sub,
  isNegative = false,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  isNegative?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`rounded-lg border border-zinc-200 bg-white px-5 py-4 shadow-2xs transition-all hover:shadow-xs ${
        onClick ? "cursor-pointer text-left" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${isNegative ? "text-rose-600" : "text-zinc-900"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] font-medium text-zinc-400">{sub}</p>}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export function Th({
  children,
  align = "left",
  className = "",
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={`border-b border-r border-zinc-200 bg-zinc-100/90 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-600 last:border-r-0 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`border-b border-r border-zinc-200 px-2 py-1 text-sm last:border-r-0 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

export function Computed({ children, value }: { children: React.ReactNode; value?: number }) {
  const isNegative = value !== undefined ? value < 0 : false;
  return (
    <span
      className={`block px-2.5 py-1 text-right font-semibold tabular-nums ${
        isNegative ? "text-rose-600" : "text-zinc-900"
      }`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Inline (in-table) inputs — compact, no visible label
// ---------------------------------------------------------------------------

export function CellTextInput({
  value,
  onChange,
  list,
}: {
  value: string;
  onChange: (v: string) => void;
  list?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      list={list}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-sm px-2.5 py-1 text-sm text-indigo-700 outline-none transition-colors hover:bg-indigo-50/50 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-500"
    />
  );
}

export function CellNumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const isNegative = value < 0;
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.valueAsNumber || 0)}
      className={`w-full rounded-sm px-2.5 py-1 text-right tabular-nums outline-none transition-colors hover:bg-indigo-50/50 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 ${
        isNegative ? "font-semibold text-rose-600" : "font-medium text-indigo-700"
      }`}
    />
  );
}

// ---------------------------------------------------------------------------
// Form fields — labeled, used in "add new" forms
// ---------------------------------------------------------------------------

const fieldInputClass =
  "rounded-sm border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="flex flex-col gap-1 text-xs font-medium text-zinc-500">{children}</span>;
}

export function TextField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
      {label}
      <input type="text" {...props} className={fieldInputClass} />
    </label>
  );
}

export function NumberField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
      {label}
      <input type="number" {...props} className={fieldInputClass} />
    </label>
  );
}

export function DateField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
      {label}
      <input type="date" {...props} className={fieldInputClass} />
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
      {label}
      <select {...props} className={fieldInputClass}>
        {children}
      </select>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export function PrimaryButton({
  children,
  className = "",
  ...props
}: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`cursor-pointer rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function IconRemoveButton({
  onClick,
  label,
  className = "",
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`cursor-pointer text-zinc-400 transition-colors hover:text-red-500 ${className}`}
    >
      <IconX className="h-4 w-4" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Icons — small stroke-based SVGs used in place of emoji throughout the app
// ---------------------------------------------------------------------------

type IconProps = { className?: string };
const iconBase = { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 } as const;

export function IconX({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function IconBook({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

export function IconVideo({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <rect x="2.5" y="6" width="14" height="12" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5l5-3v9l-5-3" />
    </svg>
  );
}

export function IconFile({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6h6" />
    </svg>
  );
}

export function IconNotes({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function IconDownload({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" />
    </svg>
  );
}

export function IconUpload({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 0L8 7m4-4l4 4M5 19h14" />
    </svg>
  );
}

export function IconWarning({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

export function IconHandshake({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l2.5 2.5L16 9" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function IconMaximize({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4H5a1 1 0 00-1 1v4M15 4h4a1 1 0 011 1v4M9 20H5a1 1 0 01-1-1v-4M15 20h4a1 1 0 001-1v-4" />
    </svg>
  );
}

export function IconMinimize({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 4v3a1 1 0 01-1 1H4M16 4v3a1 1 0 001 1h3M8 20v-3a1 1 0 00-1-1H4M16 20v-3a1 1 0 011-1h3" />
    </svg>
  );
}

export function IconEye({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconLock({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}
