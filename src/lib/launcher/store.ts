'use client';

// Andromeda launcher — central state store (zustand).

import { create } from 'zustand';
import type {
  CCToggles,
  DragPayload,
  Layout,
  Overlay,
  PlacedItem,
  Prefs,
  Reminder,
  Shade,
  WeatherData,
  WidgetInstance,
} from './types';
import {
  clearAll,
  defaultLayout,
  defaultPrefs,
  loadLayout,
  loadPrefs,
  loadReminders,
  saveReminders,
  saveState,
} from './storage';
import { TRACKS } from './music';

const MAX_PAGE = 3; // 4 pages total (zero page lives separately at -1)

function clampPage(i: number): number {
  return Math.max(-1, Math.min(MAX_PAGE, i));
}

/** Build an occupancy map for a page (which cells are taken). */
export function occupancy(page: PlacedItem[]): boolean[][] {
  const map = Array.from({ length: 6 }, () => Array(4).fill(false));
  for (const p of page) {
    for (let r = p.row; r < Math.min(6, p.row + p.h); r++) {
      for (let c = p.col; c < Math.min(4, p.col + p.w); c++) {
        if (map[r]?.[c] !== undefined) map[r][c] = true;
      }
    }
  }
  return map;
}

/** First free slot fitting w×h, scanning row-major. */
export function firstFree(page: PlacedItem[], w = 1, h = 1): { col: number; row: number } | null {
  const map = occupancy(page);
  for (let r = 0; r <= 6 - h; r++) {
    for (let c = 0; c <= 4 - w; c++) {
      let ok = true;
      for (let dr = 0; dr < h && ok; dr++) {
        for (let dc = 0; dc < w && ok; dc++) {
          if (map[r + dr][c + dc]) ok = false;
        }
      }
      if (ok) return { col: c, row: r };
    }
  }
  return null;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export interface LauncherState {
  hydrated: boolean;
  prefs: Prefs;
  layout: Layout;
  page: number;
  overlay: Overlay;
  editMode: boolean;
  dragging: DragPayload | null;
  weather: WeatherData | null;
  weatherLoading: boolean;
  batteryLevel: number;
  batteryCharging: boolean;
  batterySupported: boolean;
  /** incremented every second — drives clock widgets */
  tick: number;

  /** lock screen (boot state, honoring prefs.showLockScreen) */
  locked: boolean;
  /** control / notification center shade */
  shade: Shade;
  ccToggles: CCToggles;
  /** media player state (survives navigation, not persisted) */
  music: { playing: boolean; trackIndex: number; position: number };
  reminders: Reminder[];

  hydrate: () => void;
  setPrefs: (patch: Partial<Prefs>) => void;
  resetAll: () => void;
  setPage: (i: number) => void;
  setOverlay: (o: Overlay) => void;
  closeOverlay: () => void;
  setEditMode: (on: boolean) => void;
  setDragging: (d: DragPayload | null) => void;
  setWeather: (w: WeatherData | null) => void;
  setWeatherLoading: (v: boolean) => void;
  setBattery: (level: number, charging: boolean, supported: boolean) => void;
  bumpTick: () => void;

  unlock: () => void;
  lock: () => void;
  setShade: (s: Shade) => void;
  toggleCC: (k: keyof CCToggles) => void;

  playPause: () => void;
  nextTrack: (dir?: number) => void;
  seekTo: (pos: number) => void;
  tickMusic: () => void;

  addReminder: (text: string, list?: Reminder['list']) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;
  clearDoneReminders: () => void;

  launchApp: (appId: string) => void;
  pushHistory: (q: string) => void;
  clearHistory: () => void;

  // ---- layout actions ----
  addAppToPage: (appId: string, page?: number, col?: number, row?: number) => void;
  removePlaced: (page: number, key: string) => void;
  movePlaced: (page: number, key: string, col: number, row: number) => boolean;
  /** push-aside: relocate a clashing item to the nearest free cell */
  pushAside: (page: number, key: string) => void;
  setDockSlot: (appId: string, index: number) => void;
  swapDock: (i: number, j: number) => void;
  removeFromDock: (index: number) => void;
  createFolderAt: (page: number, key: string, targetKey: string) => void;
  addToFolder: (folderId: string, appId: string) => void;
  removeFromFolder: (folderId: string, appId: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  removeFolder: (folderId: string) => void;
  addWidget: (w: WidgetInstance, page: number, col?: number, row?: number) => boolean;
  removeWidgetAnywhere: (widgetId: string) => void;
  addZeroWidget: (w: WidgetInstance) => void;
  moveZeroWidget: (id: string, dir: -1 | 1) => void;
  removeZeroWidget: (id: string) => void;
  updateZeroWidget: (w: WidgetInstance) => void;
  hideApp: (appId: string) => void;
  unhideApp: (appId: string) => void;
  toggleHidden: (appId: string) => void;
  renameApp: (appId: string, name: string) => void;
}

const initialPrefs = defaultPrefs();
const initialLayout = defaultLayout();

export const useLauncher = create<LauncherState>((set, get) => ({
  hydrated: false,
  prefs: initialPrefs,
  layout: initialLayout,
  page: 0,
  overlay: { kind: 'none' },
  editMode: false,
  dragging: null,
  weather: null,
  weatherLoading: false,
  batteryLevel: 0.78,
  batteryCharging: false,
  batterySupported: false,
  tick: 0,
  locked: false,
  shade: 'none',
  ccToggles: { wifi: true, bluetooth: true, airplane: false, flashlight: false },
  music: { playing: false, trackIndex: 0, position: 0 },
  reminders: [],

  hydrate: () => {
    if (get().hydrated) return;
    const prefs = loadPrefs() ?? defaultPrefs();
    const layout = loadLayout() ?? defaultLayout();
    const reminders = loadReminders();
    set({ hydrated: true, prefs, layout, reminders, locked: prefs.showLockScreen });
  },

  setPrefs: (patch) => {
    set((s) => ({ prefs: { ...s.prefs, ...patch } }));
    const { prefs, layout } = get();
    saveState(prefs, layout);
  },

  resetAll: () => {
    clearAll();
    const prefs = defaultPrefs();
    const layout = defaultLayout();
    saveState(prefs, layout);
    set({
      prefs,
      layout,
      page: 0,
      overlay: { kind: 'none' },
      editMode: false,
      dragging: null,
      reminders: [],
      shade: 'none',
      music: { playing: false, trackIndex: 0, position: 0 },
    });
  },

  setPage: (i) => set({ page: clampPage(i) }),
  setOverlay: (o) => set({ overlay: o }),
  closeOverlay: () => set({ overlay: { kind: 'none' } }),
  setEditMode: (on) => set({ editMode: on }),
  setDragging: (d) => set({ dragging: d }),
  setWeather: (w) => set({ weather: w }),
  setWeatherLoading: (v) => set({ weatherLoading: v }),
  setBattery: (level, charging, supported) =>
    set({ batteryLevel: level, batteryCharging: charging, batterySupported: supported }),
  bumpTick: () => set((s) => ({ tick: s.tick + 1 })),

  unlock: () => set({ locked: false, shade: 'none' }),
  lock: () =>
    set({
      locked: true,
      overlay: { kind: 'none' },
      shade: 'none',
      editMode: false,
      dragging: null,
      music: { ...get().music, playing: false },
    }),
  setShade: (s) => {
    // the shade only opens over the home screen (no app/drawer overlays)
    if (s !== 'none') {
      const st = get();
      if (st.locked || st.overlay.kind !== 'none' || st.editMode) return;
    }
    set({ shade: s });
  },
  toggleCC: (k) => set((s) => ({ ccToggles: { ...s.ccToggles, [k]: !s.ccToggles[k] } })),

  playPause: () => set((s) => ({ music: { ...s.music, playing: !s.music.playing } })),
  nextTrack: (dir = 1) =>
    set((s) => ({
      music: {
        ...s.music,
        trackIndex: (s.music.trackIndex + dir + TRACKS.length) % TRACKS.length,
        position: 0,
        playing: true,
      },
    })),
  seekTo: (pos) =>
    set((s) => {
      const dur = TRACKS[s.music.trackIndex]?.duration ?? 1;
      return { music: { ...s.music, position: Math.max(0, Math.min(dur - 1, pos)) } };
    }),
  tickMusic: () =>
    set((s) => {
      if (!s.music.playing) return {};
      const dur = TRACKS[s.music.trackIndex]?.duration ?? 1;
      if (s.music.position + 1 >= dur) {
        return {
          music: {
            playing: true,
            trackIndex: (s.music.trackIndex + 1) % TRACKS.length,
            position: 0,
          },
        };
      }
      return { music: { ...s.music, position: s.music.position + 1 } };
    }),

  addReminder: (text, list = 'today') => {
    const t = text.trim();
    if (!t) return;
    const r: Reminder = { id: uid(), text: t, done: false, createdAt: Date.now(), list };
    const reminders = [r, ...get().reminders];
    set({ reminders });
    saveReminders(reminders);
  },
  toggleReminder: (id) => {
    const reminders = get().reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r));
    set({ reminders });
    saveReminders(reminders);
  },
  removeReminder: (id) => {
    const reminders = get().reminders.filter((r) => r.id !== id);
    set({ reminders });
    saveReminders(reminders);
  },
  clearDoneReminders: () => {
    const reminders = get().reminders.filter((r) => !r.done);
    set({ reminders });
    saveReminders(reminders);
  },

  launchApp: (appId) => {
    // usage tracking for the suggestions widget
    set((s) => {
      const u = s.prefs.usage[appId] ?? { count: 0, last: 0 };
      return {
        prefs: {
          ...s.prefs,
          usage: { ...s.prefs.usage, [appId]: { count: u.count + 1, last: Date.now() } },
        },
      };
    });
    const { prefs, layout } = get();
    saveState(prefs, layout);
    set({ overlay: { kind: 'app', appId } });
  },

  pushHistory: (q) => {
    const t = q.trim();
    if (!t) return;
    set((s) => {
      const rest = s.prefs.searchHistory.filter((h) => h.toLowerCase() !== t.toLowerCase());
      return { prefs: { ...s.prefs, searchHistory: [t, ...rest].slice(0, 8) } };
    });
    const { prefs, layout } = get();
    saveState(prefs, layout);
  },

  clearHistory: () => {
    set((s) => ({ prefs: { ...s.prefs, searchHistory: [] } }));
    const { prefs, layout } = get();
    saveState(prefs, layout);
  },

  addAppToPage: (appId, pageArg, colArg, rowArg) => {
    const state = get();
    const pageIdx = clampPage(pageArg ?? state.page);
    let pages = state.layout.pages.map((p) => [...p]);
    while (pages.length <= pageIdx) pages.push([]);
    const page = pages[pageIdx].map((p) => ({ ...p }));
    let col = colArg;
    let row = rowArg;
    if (col === undefined || row === undefined) {
      const free = firstFree(page);
      if (!free) return;
      col = free.col;
      row = free.row;
    }
    page.push({ key: `a-${uid()}`, item: { type: 'app', appId }, col, row, w: 1, h: 1 });
    const layout = { ...state.layout, pages };
    layout.pages[pageIdx] = page;
    set({ layout });
    saveState(state.prefs, layout);
  },

  removePlaced: (pageIdx, key) => {
    const state = get();
    const pages = state.layout.pages.map((p, i) =>
      i === pageIdx ? p.filter((it) => it.key !== key) : [...p],
    );
    const layout = { ...state.layout, pages };
    set({ layout });
    saveState(state.prefs, layout);
  },

  movePlaced: (pageIdx, key, col, row) => {
    const state = get();
    const pages = state.layout.pages.map((p, i) => (i === pageIdx ? p.map((it) => ({ ...it })) : [...p]));
    const page = pages[pageIdx];
    const moving = page.find((it) => it.key === key);
    if (!moving) return false;
    if (moving.col === col && moving.row === row) return true;
    // check fit
    for (let r = row; r < row + moving.h; r++) {
      for (let c = col; c < col + moving.w; c++) {
        if (r >= 6 || c >= 4 || r < 0 || c < 0) return false;
        const clash = page.find(
          (it) =>
            it.key !== key &&
            c >= it.col && c < it.col + it.w && r >= it.row && r < it.row + it.h,
        );
        if (clash) return false;
      }
    }
    moving.col = col;
    moving.row = row;
    const layout = { ...state.layout, pages };
    set({ layout });
    saveState(state.prefs, layout);
    return true;
  },

  /** push-aside: relocate a clashing item to the nearest free cell (BFS by distance). */
  pushAside: (pageIdx, key) => {
    const state = get();
    const pages = state.layout.pages.map((p, i) => (i === pageIdx ? p.map((it) => ({ ...it })) : [...p]));
    const page = pages[pageIdx];
    const moving = page.find((it) => it.key === key);
    if (!moving) return;
    const map = occupancy(page.filter((it) => it.key !== key));
    // BFS ring search from current position for nearest free block
    const start = { c: moving.col, r: moving.row };
    let best: { col: number; row: number } | null = null;
    let bestD = Infinity;
    for (let r = 0; r <= 6 - moving.h; r++) {
      for (let c = 0; c <= 4 - moving.w; c++) {
        let ok = true;
        for (let dr = 0; dr < moving.h && ok; dr++) {
          for (let dc = 0; dc < moving.w && ok; dc++) {
            if (map[r + dr][c + dc]) ok = false;
          }
        }
        if (ok) {
          const d = Math.abs(r - start.r) + Math.abs(c - start.c) * 1.25;
          if (d < bestD) {
            bestD = d;
            best = { col: c, row: r };
          }
        }
      }
    }
    if (!best) return;
    moving.col = best.col;
    moving.row = best.row;
    const layout = { ...state.layout, pages };
    set({ layout });
    saveState(state.prefs, layout);
  },

  setDockSlot: (appId, index) => {
    const state = get();
    if (index < 0 || index > 3) return;
    const dock = [...state.layout.dock];
    // remove app from its previous dock slot if present
    const prev = dock.indexOf(appId);
    if (prev !== -1) dock[prev] = null;
    const evicted = dock[index];
    dock[index] = appId;
    // remove the app from any page if it was there
    const pages = state.layout.pages.map((p) => p.filter((it) => !(it.item.type === 'app' && it.item.appId === appId)));
    // if another app was evicted, park it on the current page
    if (evicted) {
      const pageIdx = clampPage(state.page);
      while (pages.length <= pageIdx) pages.push([]);
      const page = pages[pageIdx].map((p) => ({ ...p }));
      const free = firstFree(page);
      if (free) {
        page.push({ key: `a-${uid()}`, item: { type: 'app', appId: evicted }, col: free.col, row: free.row, w: 1, h: 1 });
        pages[pageIdx] = page;
      } else {
        // find any page with room
        outer: for (let i = 0; i < pages.length; i++) {
          const f = firstFree(pages[i]);
          if (f) {
            pages[i] = [...pages[i], { key: `a-${uid()}`, item: { type: 'app', appId: evicted }, col: f.col, row: f.row, w: 1, h: 1 }];
            break outer;
          }
        }
      }
    }
    const layout = { ...state.layout, dock, pages };
    set({ layout });
    saveState(state.prefs, layout);
  },

  swapDock: (i, j) => {
    const state = get();
    if (i < 0 || i > 3 || j < 0 || j > 3 || i === j) return;
    const dock = [...state.layout.dock];
    [dock[i], dock[j]] = [dock[j], dock[i]];
    const layout = { ...state.layout, dock };
    set({ layout });
    saveState(state.prefs, layout);
  },

  removeFromDock: (index) => {
    const state = get();
    const dock = [...state.layout.dock];
    dock[index] = null;
    const layout = { ...state.layout, dock };
    set({ layout });
    saveState(state.prefs, layout);
  },

  createFolderAt: (pageIdx, key, targetKey) => {
    const state = get();
    const pages = state.layout.pages.map((p, i) => (i === pageIdx ? p.map((it) => ({ ...it })) : [...p]));
    const page = pages[pageIdx];
    const a = page.find((it) => it.key === key);
    const b = page.find((it) => it.key === targetKey);
    if (!a || !b || a === b) return;
    if (a.item.type !== 'app') return;
    if (b.item.type !== 'app' && b.item.type !== 'folder') return;

    const appIdA = a.item.appId;
    let folderId: string;
    if (b.item.type === 'folder') {
      // merge into existing folder
      folderId = b.item.folderId;
      const folders = { ...state.layout.folders };
      const f = folders[folderId];
      if (f) folders[folderId] = { ...f, appIds: [...new Set([...f.appIds, appIdA])] };
      const layoutNow = { ...state.layout, folders, pages: pages.map((p, i) => (i === pageIdx ? p.filter((it) => it.key !== key) : p)) };
      set({ layout: layoutNow });
      saveState(state.prefs, layoutNow);
      return;
    }
    // brand new folder at b's cell
    folderId = `f-${uid()}`;
    const folders = {
      ...state.layout.folders,
      [folderId]: {
        id: folderId,
        name: 'New Folder',
        appIds: [b.item.appId, appIdA],
      },
    };
    const newPages = pages.map((p, i) => {
      if (i !== pageIdx) return [...p];
      return p
        .filter((it) => it.key !== key && it.key !== targetKey)
        .concat([{ key: `fld-${uid()}`, item: { type: 'folder', folderId }, col: b.col, row: b.row, w: 1, h: 1 }]);
    });
    const layout = { ...state.layout, folders, pages: newPages };
    set({ layout });
    saveState(state.prefs, layout);
  },

  addToFolder: (folderId, appId) => {
    const state = get();
    const f = state.layout.folders[folderId];
    if (!f) return;
    const folders = {
      ...state.layout.folders,
      [folderId]: { ...f, appIds: [...new Set([...f.appIds, appId])] },
    };
    const pages = state.layout.pages.map((p) => p.filter((it) => !(it.item.type === 'app' && it.item.appId === appId)));
    const layout = { ...state.layout, folders, pages };
    set({ layout });
    saveState(state.prefs, layout);
  },

  removeFromFolder: (folderId, appId) => {
    const state = get();
    const f = state.layout.folders[folderId];
    if (!f) return;
    const remaining = f.appIds.filter((id) => id !== appId);
    const folders = { ...state.layout.folders };
    let pages = state.layout.pages.map((p) => [...p]);
    if (remaining.length === 0) {
      delete folders[folderId];
      pages = pages.map((p) => p.filter((it) => !(it.item.type === 'folder' && it.item.folderId === folderId)));
    } else if (remaining.length === 1) {
      // folder with a single app collapses back to a plain app icon
      const last = remaining[0];
      delete folders[folderId];
      pages = pages.map((p) =>
        p.map((it) =>
          it.item.type === 'folder' && it.item.folderId === folderId
            ? { ...it, item: { type: 'app', appId: last } }
            : it,
        ),
      );
    } else {
      folders[folderId] = { ...f, appIds: remaining };
    }
    const layout = { ...state.layout, folders, pages };
    set({ layout });
    saveState(state.prefs, layout);
  },

  renameFolder: (folderId, name) => {
    const state = get();
    const f = state.layout.folders[folderId];
    if (!f) return;
    const folders = { ...state.layout.folders, [folderId]: { ...f, name: name || 'Folder' } };
    const layout = { ...state.layout, folders };
    set({ layout });
    saveState(state.prefs, layout);
  },

  removeFolder: (folderId) => {
    const state = get();
    const f = state.layout.folders[folderId];
    if (!f) return;
    const folders = { ...state.layout.folders };
    delete folders[folderId];
    const pages = state.layout.pages.map((p) => p.filter((it) => !(it.item.type === 'folder' && it.item.folderId === folderId)));
    const layout = { ...state.layout, folders, pages };
    set({ layout });
    saveState(state.prefs, layout);
    // park apps back on pages
    for (const appId of f.appIds) get().addAppToPage(appId);
  },

  addWidget: (w, pageIdx, colArg, rowArg) => {
    const state = get();
    const idx = clampPage(pageIdx);
    let pages = state.layout.pages.map((p) => [...p]);
    while (pages.length <= idx) pages.push([]);
    const page = pages[idx].map((p) => ({ ...p }));
    let col = colArg;
    let row = rowArg;
    if (col === undefined || row === undefined) {
      const free = firstFree(page, w.span, w.rows);
      if (!free) return false;
      col = free.col;
      row = free.row;
    }
    page.push({ key: w.id, item: { type: 'widget', widget: w }, col, row, w: w.span, h: w.rows });
    pages[idx] = page;
    const layout = { ...state.layout, pages };
    set({ layout });
    saveState(state.prefs, layout);
    return true;
  },

  removeWidgetAnywhere: (widgetId) => {
    const state = get();
    const pages = state.layout.pages.map((p) => p.filter((it) => !(it.item.type === 'widget' && it.item.widget.id === widgetId)));
    const zeroPage = state.layout.zeroPage.filter((w) => w.id !== widgetId);
    const layout = { ...state.layout, pages, zeroPage };
    set({ layout });
    saveState(state.prefs, layout);
  },

  addZeroWidget: (w) => {
    const state = get();
    const zeroPage = [...state.layout.zeroPage, w];
    const layout = { ...state.layout, zeroPage };
    set({ layout });
    saveState(state.prefs, layout);
  },

  moveZeroWidget: (id, dir) => {
    const state = get();
    const z = [...state.layout.zeroPage];
    const i = z.findIndex((w) => w.id === id);
    const j = i + dir;
    if (i === -1 || j < 0 || j >= z.length) return;
    [z[i], z[j]] = [z[j], z[i]];
    const layout = { ...state.layout, zeroPage: z };
    set({ layout });
    saveState(state.prefs, layout);
  },

  removeZeroWidget: (id) => {
    const state = get();
    const zeroPage = state.layout.zeroPage.filter((w) => w.id !== id);
    const layout = { ...state.layout, zeroPage };
    set({ layout });
    saveState(state.prefs, layout);
  },

  updateZeroWidget: (w) => {
    const state = get();
    const zeroPage = state.layout.zeroPage.map((x) => (x.id === w.id ? w : x));
    const layout = { ...state.layout, zeroPage };
    set({ layout });
    saveState(state.prefs, layout);
  },

  hideApp: (appId) => {
    const state = get();
    if (state.prefs.hiddenApps.includes(appId)) return;
    set({ prefs: { ...state.prefs, hiddenApps: [...state.prefs.hiddenApps, appId] } });
    const { prefs, layout } = get();
    saveState(prefs, layout);
  },

  unhideApp: (appId) => {
    const state = get();
    set({ prefs: { ...state.prefs, hiddenApps: state.prefs.hiddenApps.filter((h) => h !== appId) } });
    const { prefs, layout } = get();
    saveState(prefs, layout);
  },

  toggleHidden: (appId) => {
    const state = get();
    if (state.prefs.hiddenApps.includes(appId)) get().unhideApp(appId);
    else get().hideApp(appId);
  },

  renameApp: (appId, name) => {
    const state = get();
    const renames = { ...state.prefs.renames };
    if (name.trim()) renames[appId] = name.trim();
    else delete renames[appId];
    set({ prefs: { ...state.prefs, renames } });
    const { prefs, layout } = get();
    saveState(prefs, layout);
  },
}));
