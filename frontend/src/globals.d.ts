/// <reference types="office-js" />

declare const Excel: typeof import("office-js").Excel;

import 'chart.js';

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    trendlineLinear?: {
      colorMin?: string;
      colorMax?: string;
      lineStyle?: string;
      width?: number;
      projection?: boolean;
      [key: string]: any;
    };
  }
}