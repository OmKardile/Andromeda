'use client';

// Widget registry — the single contract between the launcher shell and the
// widget suite. Each widget component receives WidgetProps.
//
// OWNERSHIP: widgets/*.tsx are owned by the widget-suite agent; the shell
// only consumes this registry.

import type { ComponentType } from 'react';
import type { WidgetInstance, WidgetKind } from '@/lib/launcher/types';

export interface WidgetProps {
  widget: WidgetInstance;
  /** rendered size in px */
  width: number;
  height: number;
  /** full = zero page (larger, interactive), workspace = home page */
  mode: 'workspace' | 'full';
}

export interface WidgetCatalogEntry {
  kind: WidgetKind;
  title: string;
  description: string;
  sizes: { span: 2 | 4; rows: 2 | 4 }[];
  /** component used in both grid and zero page */
  component: ComponentType<WidgetProps>;
}

import { AnalogClock } from './AnalogClock';
import { DigitalClock } from './DigitalClock';
import { WorldClock } from './WorldClock';
import { CalendarWidget } from './CalendarWidget';
import { WeatherWidget } from './WeatherWidget';
import { BatteryWidget } from './BatteryWidget';
import { PhotoWidget } from './PhotoWidget';
import { SuggestionsWidget } from './SuggestionsWidget';

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  {
    kind: 'clock-analog',
    title: 'Clock',
    description: 'Elegant analog clock',
    sizes: [{ span: 4, rows: 2 }, { span: 2, rows: 2 }],
    component: AnalogClock,
  },
  {
    kind: 'clock-digital',
    title: 'Digital Clock',
    description: 'Time, date and greeting',
    sizes: [{ span: 4, rows: 2 }],
    component: DigitalClock,
  },
  {
    kind: 'world-clock',
    title: 'World Clock',
    description: 'Four time zones at a glance',
    sizes: [{ span: 4, rows: 2 }],
    component: WorldClock,
  },
  {
    kind: 'calendar',
    title: 'Calendar',
    description: 'Month view and upcoming',
    sizes: [{ span: 4, rows: 2 }, { span: 4, rows: 4 }],
    component: CalendarWidget,
  },
  {
    kind: 'weather',
    title: 'Weather',
    description: 'Current conditions and forecast',
    sizes: [{ span: 4, rows: 2 }, { span: 4, rows: 4 }],
    component: WeatherWidget,
  },
  {
    kind: 'battery',
    title: 'Battery',
    description: 'Charge level ring',
    sizes: [{ span: 2, rows: 2 }],
    component: BatteryWidget,
  },
  {
    kind: 'photo',
    title: 'Photos',
    description: 'A photo frame widget',
    sizes: [
      { span: 2, rows: 2 },
      { span: 4, rows: 2 },
      { span: 4, rows: 4 },
    ],
    component: PhotoWidget,
  },
  {
    kind: 'suggestions',
    title: 'Suggestions',
    description: 'Smart app suggestions',
    sizes: [{ span: 4, rows: 2 }],
    component: SuggestionsWidget,
  },
];

export const WIDGET_MAP: Record<WidgetKind, WidgetCatalogEntry> = Object.fromEntries(
  WIDGET_CATALOG.map((w) => [w.kind, w]),
) as Record<WidgetKind, WidgetCatalogEntry>;
