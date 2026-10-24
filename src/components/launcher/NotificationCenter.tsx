'use client';

// NotificationCenter — pull-down shade with live, derived notifications:
// weather now, open reminders count, today's date line, battery/charging
// status, and a welcome message. "Clear" collapses them for the session
// (remembered via the ncCleared timestamp).

import { useEffect, useState } from 'react';
import { CloudSun, ListTodo, CalendarDays, BatteryCharging, Sparkles, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { glassStyle } from '@/lib/launcher/glass';
import { loadNotificationsCleared, saveNotificationsCleared } from '@/lib/launcher/storage';

interface NotifItem {
  id: string;
  app: string;
  title: string;
  body: string;
  icon: LucideIcon;
  tint: string;
  at: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function timeAgo(ts: number): string {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

export function NotificationCenter() {
  const shade = useLauncher((s) => s.shade);
  const setShade = useLauncher((s) => s.setShade);
  const weather = useLauncher((s) => s.weather);
  const reminders = useLauncher((s) => s.reminders);
  const battery = useLauncher((s) => s.batteryLevel);
  const charging = useLauncher((s) => s.batteryCharging);
  const launchApp = useLauncher((s) => s.launchApp);
  const tick = useLauncher((s) => s.tick);

  const [cleared, setCleared] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // hydrate the cleared flag once when the shade first renders
    setCleared(loadNotificationsCleared());
  }, []);

  useEffect(() => {
    setNow(new Date());
  }, [tick]);

  if (shade !== 'notifications') return null;

  const close = () => {
    setClosing(true);
    setTimeout(() => {
      setShade('none');
      setClosing(false);
    }, 260);
  };

  const openApp = (appId?: string) => {
    setShade('none');
    if (appId) launchApp(appId);
  };

  const d = now ?? new Date();

  const notifs: NotifItem[] = [];
  const bootTs = Date.now();
  if (weather) {
    notifs.push({
      id: 'weather',
      app: 'Weather',
      title: `${weather.city.name} — ${Math.round(weather.now.temperature)}°`,
      body: `Feels like ${Math.round(weather.now.apparentTemperature)}° · Humidity ${weather.now.humidity}% · Wind ${weather.now.windSpeed} km/h`,
      icon: CloudSun,
      tint: '#4BCDEF',
      at: weather.fetchedAt,
    });
  }
  const open = reminders.filter((r) => !r.done);
  if (open.length > 0) {
    notifs.push({
      id: 'reminders',
      app: 'Reminders',
      title: `${open.length} open reminder${open.length === 1 ? '' : 's'}`,
      body: open.slice(0, 3).map((r) => r.text).join(' · '),
      icon: ListTodo,
      tint: '#E8890C',
      at: open[0].createdAt,
    });
  }
  notifs.push({
    id: 'date',
    app: 'Calendar',
    title: `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`,
    body: 'No events today — enjoy the calm.',
    icon: CalendarDays,
    tint: '#FF3B30',
    at: bootTs - 3600_000,
  });
  if (charging) {
    notifs.push({
      id: 'battery',
      app: 'Battery',
      title: `Charging — ${Math.round(battery * 100)}%`,
      body: 'Connected to power.',
      icon: BatteryCharging,
      tint: '#34C759',
      at: bootTs - 7200_000,
    });
  }
  notifs.push({
    id: 'welcome',
    app: 'Andromeda',
    title: 'Welcome to Andromeda',
    body: 'Pull down from the top-right for Control Center.',
    icon: Sparkles,
    tint: '#0FB5A6',
    at: bootTs - 86_400_000,
  });

  const visible = cleared ? notifs.filter((n) => n.at > cleared) : notifs;

  return (
    <div className="absolute inset-0 z-[64]" role="dialog" aria-label="Notification Center">
      <button
        className="absolute inset-0 bg-black/45"
        style={{ backdropFilter: 'blur(2px)', animation: 'ncFadeIn 240ms both' }}
        onClick={close}
        aria-label="Close Notification Center"
      />
      <style>{`
        @keyframes ncFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ncIn { from { transform: translateY(-14%); opacity: 0.3; } to { transform: translateY(0); opacity: 1; } }
        @keyframes ncOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-14%); opacity: 0; } }
      `}</style>

      <div
        className="absolute inset-x-3 top-2 max-h-[80%] overflow-hidden rounded-[34px] px-4 pb-3 pt-3 text-white"
        style={{
          ...glassStyle(34, { dark: true, strength: 1.05 }),
          animation: `${closing ? 'ncOut' : 'ncIn'} 260ms cubic-bezier(0.32,0.72,0,1) both`,
        }}
      >
        {/* header */}
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[20px] font-bold">Notifications</h2>
          <div className="flex items-center gap-2">
            {visible.length > 0 && (
              <button
                type="button"
                className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold transition hover:bg-white/25 active:scale-95"
                onClick={() => {
                  const t = Date.now();
                  setCleared(t);
                  saveNotificationsCleared(t);
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="rounded-full bg-white/15 p-1.5 transition hover:bg-white/25 active:scale-95"
              onClick={close}
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* list */}
        <div className="launcher-scroll max-h-[calc(80vh-120px)] space-y-2 overflow-y-auto pb-2">
          {visible.length === 0 && (
            <div className="py-10 text-center text-[14px] text-white/50">No new notifications</div>
          )}
          {visible.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-[20px] bg-white/10 px-3.5 py-3 text-left transition hover:bg-white/15 active:scale-[0.98]"
                onClick={() => {
                  if (n.id === 'weather') openApp('weather');
                  else if (n.id === 'reminders') openApp('reminders');
                  else if (n.id === 'date') openApp('calendar');
                  else close();
                }}
                aria-label={`${n.app} notification: ${n.title}. ${n.body}`}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
                  style={{ background: n.tint }}
                  aria-hidden
                >
                  <Icon size={19} fill="currentColor" strokeWidth={0} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-white/60">{n.app}</span>
                    <span className="shrink-0 text-[11px] text-white/45">{timeAgo(n.at)}</span>
                  </div>
                  <div className="truncate text-[14px] font-semibold">{n.title}</div>
                  <div className="line-clamp-2 text-[13px] leading-snug text-white/70">{n.body}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
