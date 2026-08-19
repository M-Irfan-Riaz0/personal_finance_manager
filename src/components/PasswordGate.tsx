"use client";

import { useEffect, useRef, useState } from "react";
import { APP_PASSWORD } from "@/lib/auth";

const STORAGE_KEY = "pbm_unlocked";
const LAST_ACTIVITY_KEY = "pbm_last_activity";
const PASSWORD = APP_PASSWORD;
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // re-lock after 5 minutes idle

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function lock() {
    localStorage.removeItem(STORAGE_KEY);
    setUnlocked(false);
  }

  function markActive() {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(lock, IDLE_TIMEOUT_MS);
  }

  useEffect(() => {
    const wasUnlocked = localStorage.getItem(STORAGE_KEY) === "true";
    const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? 0);
    const idleFor = Date.now() - lastActivity;

    if (wasUnlocked && idleFor < IDLE_TIMEOUT_MS) {
      setUnlocked(true);
      markActive();
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!unlocked) return;

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, markActive));

    function handleVisibility() {
      if (document.visibilityState !== "visible") return;
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? 0);
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        lock();
      } else {
        markActive();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, markActive));
      document.removeEventListener("visibilitychange", handleVisibility);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "true");
      setInput("");
      setUnlocked(true);
      setError(false);
      markActive();
    } else {
      setError(true);
    }
  }

  if (!checked) return null;

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xs rounded-md border border-zinc-300 bg-white p-6 shadow-2xs"
        >
          <h1 className="mb-1 text-lg font-bold text-zinc-900">Welcome back</h1>
          <p className="mb-4 text-sm text-zinc-500">Enter your password to unlock Personal Hub.</p>
          <input
            type="password"
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            className={`w-full rounded-sm border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
              error ? "border-red-400" : "border-zinc-300 focus:border-indigo-500"
            }`}
            placeholder="Password"
          />
          {error && <p className="mt-2 text-xs text-red-600">Incorrect password.</p>}
          <button
            type="submit"
            className="mt-4 w-full cursor-pointer rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
