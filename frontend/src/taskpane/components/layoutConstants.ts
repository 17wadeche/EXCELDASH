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
  text: { w: 6, h: 8 },
  chart: { w: 7, h: 20 },
  gantt: { w: 17, h: 35 },
  image: { w: 7, h: 20 },
  metric: { w: 3, h: 5 },
  report: { w: 12, h: 10 },
  line: { w: 12, h: 1 },
  title: { w: 12, h: 6 },
};