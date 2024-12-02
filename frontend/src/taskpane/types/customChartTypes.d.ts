// customChartTypes.d.ts

import { ChartTypeRegistry } from 'chart.js';

declare module 'chart.js' {
  interface ChartTypeRegistry {
    barWithErrorBars: ChartTypeRegistry['bar'];
    lineWithErrorBars: ChartTypeRegistry['line'];
    // Add any other custom chart types you are using
  }
}
