// src/types/chartjs-plugin-trendline.d.ts
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
    legend?: any;
    tooltip?: any;
    zoom?: any;
    annotation?: any;
    datalabels?: any;
  }
}