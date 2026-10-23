'use client';

// Notes — yellow-accent iOS-style notes app. List (title = first line,
// date subtitle, preview) + fullscreen editor with autosave to
// localStorage ('andromeda.notes'). Seeds two sample notes on first run.

import { useEffect, useState } from 'react';
import { ChevronLeft, SquarePen, Trash2 } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';

interface Note {
  id: string;
  /** persisted as {id, title? derived, body, updatedAt} in localStorage */
  body: string;
  updatedAt: number;
}

const NOTES_KEY = 'andromeda.notes';
const ACCENT = '#D9A400';

const SEED: Note[] = [
  {
    id: 'seed-welcome',
    body: 'Welcome to Notes\n\nEverything you type here is saved automatically on this device — no account, no sync, no fuss.\n\nTap the compose button in the top-right corner to start a new note.',
    updatedAt: Date.now() - 26 * 3600_000,
  },
  {
    id: 'seed-groceries',
    body: 'Grocery run\n\n- Oat milk\n- Cold brew concentrate\n- Bananas\n- Sourdough loaf\n- Something green',
    updatedAt: Date.now() - 5 * 3600_000,
  },
];

function newId(): string {
  return 'n-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function noteTitle(n: Note): string {
  const first = n.body.split('\n').find((l) => l.trim()) ?? '';
  return first.trim().slice(0, 60) || 'New Note';
}

function notePreview(n: Note): string {
  const lines = n.body.split('\n');
  const rest = lines.slice(lines.findIndex((l) => l.trim()) + 1).join(' ').trim();
  return rest || 'No additional text';
}

function noteDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(now.getTime() - 24 * 3600_000);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Tolerant read: migrates the legacy {id, text} shape and skips junk rows. */
function normalizeNote(raw: unknown): Note | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string') return null;
  const body =
    typeof r.body === 'string' ? r.body : typeof r.text === 'string' ? r.text : '';
  const updatedAt = typeof r.updatedAt === 'number' ? r.updatedAt : Date.now();
  return { id: r.id, body, updatedAt };
}

export function NotesApp() {
  const closeOverlay = useLauncher((s) => s.closeOverlay);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // load once (async set keeps the render pass pure)
  useEffect(() => {
    const t = setTimeout(() => {
      let loaded: Note[] | null = null;
      try {
        const raw = window.localStorage.getItem(NOTES_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const norm = parsed.map(normalizeNote).filter((n): n is Note => n !== null);
            if (norm.length > 0) loaded = norm;
          }
        }
      } catch {
        // corrupted storage — fall through to the seed
      }
      setNotes(loaded ?? SEED);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // autosave (localStorage writes inside effects are allowed)
  useEffect(() => {
    if (notes === null) return;
    try {
      window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch {
      // storage full — non-fatal
    }
  }, [notes]);

  const sorted = notes ? [...notes].sort((a, b) => b.updatedAt - a.updatedAt) : [];
  const editing = notes?.find((n) => n.id === editingId) ?? null;

  const createNote = () => {
    const note: Note = { id: newId(), body: '', updatedAt: Date.now() };
    setNotes((prev) => [note, ...(prev ?? [])]);
    setEditingId(note.id);
  };

  const updateBody = (id: string, body: string) => {
    setNotes((prev) =>
      prev ? prev.map((n) => (n.id === id ? { ...n, body, updatedAt: Date.now() } : n)) : prev,
    );
  };

  const deleteEditing = () => {
    if (!editingId) return;
    setNotes((prev) => (prev ? prev.filter((n) => n.id !== editingId) : prev));
    setEditingId(null);
    setConfirmDelete(false);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#F2F2F7]">
      {/* list */}
      <div className="launcher-scroll relative flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-5 pb-2 pt-[58px]">
          <h1 className="text-[34px] font-bold text-black">Notes</h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={createNote}
              className="flex h-11 w-11 items-center justify-center rounded-full active:bg-black/5"
              aria-label="New note"
            >
              <SquarePen size={22} style={{ color: ACCENT }} />
            </button>
            <button
              type="button"
              onClick={closeOverlay}
              className="flex h-11 items-center gap-0.5 rounded-full bg-black/[0.06] pl-2 pr-3 text-[14px] font-medium text-black active:bg-black/10"
              aria-label="Back to home screen"
            >
              <ChevronLeft size={16} strokeWidth={2.5} /> Home
            </button>
          </div>
        </div>

        <div className="mx-[10px] overflow-hidden rounded-[10px] bg-white">
          {sorted.map((n, i) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setEditingId(n.id)}
              className="relative block w-full px-4 py-3 text-left"
              aria-label={`Open note ${noteTitle(n)}`}
            >
              {i > 0 && <span className="absolute left-[16px] right-0 top-0 h-px bg-black/[0.08]" aria-hidden />}
              <div className="text-[17px] font-semibold text-black">{noteTitle(n)}</div>
              <div className="mt-0.5 flex gap-2 text-[13px] leading-snug text-black/45">
                <span className="shrink-0">{noteDate(n.updatedAt)}</span>
                <span className="truncate">{notePreview(n)}</span>
              </div>
            </button>
          ))}
          {notes !== null && sorted.length === 0 && (
            <div className="px-4 py-10 text-center text-[15px] text-black/40">No notes yet</div>
          )}
          {notes === null && <div className="px-4 py-10 text-center text-[15px] text-black/30">Loading…</div>}
        </div>

        <p className="px-5 pt-4 text-center text-[12px] text-black/35">
          {sorted.length} note{sorted.length === 1 ? '' : 's'} · saved on this device
        </p>
      </div>

      {/* editor */}
      {editing && (
        <div
          className="absolute inset-0 z-10 flex flex-col bg-white"
          role="dialog"
          aria-label={`Editing ${noteTitle(editing)}`}
          style={{ animation: 'notesIn 320ms cubic-bezier(0.25,0.1,0.25,1)' }}
        >
          <style>{`@keyframes notesIn { from { transform: translateX(100%);} to { transform: translateX(0);} }`}</style>

          <div className="flex items-center justify-between border-b border-black/[0.08] px-2 pb-2 pt-[58px]">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="flex h-11 items-center gap-0.5 pl-2 pr-3 text-[17px] font-medium"
              style={{ color: ACCENT }}
              aria-label="Back to notes list"
            >
              <ChevronLeft size={22} /> Notes
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full active:bg-black/5"
              aria-label="Delete note"
            >
              <Trash2 size={20} style={{ color: ACCENT }} />
            </button>
          </div>

          <textarea
            className="launcher-scroll flex-1 resize-none bg-white px-4 py-3 text-[17px] leading-[1.45] text-black outline-none placeholder:text-black/25"
            value={editing.body}
            placeholder="Start typing…"
            onChange={(e) => updateBody(editing.id, e.target.value)}
            autoFocus
            spellCheck
          />

          <div className="border-t border-black/[0.08] px-4 py-2 text-center text-[12px] text-black/35">
            {noteDate(editing.updatedAt)} · saved automatically
          </div>
        </div>
      )}

      {/* delete confirmation */}
      {confirmDelete && editing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 px-10">
          <div
            className="w-full overflow-hidden rounded-[14px] bg-[#F2F2F7]/95 text-center shadow-2xl backdrop-blur-xl"
            role="alertdialog"
            aria-modal="true"
            aria-label="Delete note"
            style={{ animation: 'notesAlert 220ms cubic-bezier(0.2,0,0,1)' }}
          >
            <style>{`@keyframes notesAlert { from { transform: scale(1.12); opacity: 0;} to { transform: scale(1); opacity: 1;} }`}</style>
            <div className="px-4 pb-4 pt-5">
              <h2 className="text-[17px] font-semibold text-black">Delete “{noteTitle(editing)}”?</h2>
              <p className="mt-1 text-[13px] leading-snug text-black/55">
                This note will be permanently removed from this device.
              </p>
            </div>
            <div className="h-px bg-black/10" />
            <div className="flex h-[44px]">
              <button
                type="button"
                className="flex-1 text-[17px] text-black/60 active:bg-black/5"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <div className="w-px bg-black/10" />
              <button
                type="button"
                className="flex-1 text-[17px] font-semibold text-[#FF3B30] active:bg-black/5"
                onClick={deleteEditing}
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
