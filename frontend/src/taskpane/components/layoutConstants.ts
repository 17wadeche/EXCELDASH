// src/taskpane/components/layoutConstants.ts

export type Breakpoint = 'xxl' | 'xl' |'lg' | 'md' | 'sm';

export const GRID_COLS: { [key in Breakpoint]: number } = {
  xxl:48,
  xl: 48,
  lg: 48,
  md: 36,
  sm: 24,
};

export const BREAKPOINTS: Breakpoint[] = ['xxl', 'xl', 'lg', 'md', 'sm'];

export const WIDGET_SIZES: { [key: string]: { w: number; h: number } } = {
  text: { w: 6, h: 24 },
  chart: { w: 6, h: 80 },
  gantt: { w: 9, h: 100 },
  image: { w: 6, h: 80 },
  metric: { w: 2, h: 30 },
  report: { w: 6, h: 30 },
  line: { w: 6, h: 3 },
  title: { w: 8, h: 24 },
};