// src/taskpane/components/layoutConstants.ts

export type Breakpoint = "xxl" | "xl" | "lg" | "md" | "sm";

export const GRID_COLS: { [key in Breakpoint]: number } = {
  xxl: 48,
  xl: 48,
  lg: 48,
  md: 36,
  sm: 24,
};

export const BREAKPOINTS: Breakpoint[] = ["xxl", "xl", "lg", "md", "sm"];

export const WIDGET_SIZES: { [key: string]: { w: number; h: number } } = {
  text: { w: 6, h: 24 },
  chart: { w: 9, h: 100 },
  gantt: { w: 20, h: 160 },
  image: { w: 9, h: 100 },
  metric: { w: 4, h: 60 },
  table: { w: 20, h: 160 },
  line: { w: 6, h: 3 },
  title: { w: 12, h: 24 },
};
