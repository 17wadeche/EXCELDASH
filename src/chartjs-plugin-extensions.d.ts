// chartjs-plugin-extensions.d.ts

import { AnnotationOptions } from 'chartjs-plugin-annotation';
import { ZoomOptions } from 'chartjs-plugin-zoom';
import { ChartType } from 'chart.js';

declare module 'chart.js' {
  interface ChartOptions<TType extends ChartType = ChartType> {
    plugins?: {
      annotation?: AnnotationOptions;
      zoom?: ZoomOptions;
      [key: string]: any;
    };
  }
}