// customChartTypes.d.ts

import { Chart as ChartJS, ChartTypeRegistry } from 'chart.js';

declare module 'chart.js' {
  interface ParallelCoordinatesDataPoint {
    values: number[];
  }

  interface ChartTypeRegistry {
    parallelCoordinates: {
      chartOptions: ChartOptions<'parallelCoordinates'>;
      datasetOptions: ParallelCoordinatesControllerDatasetOptions;
      defaultDataPoint: ParallelCoordinatesDataPoint;
      metaExtensions: {};
      parsedDataType: ParallelCoordinatesDataPoint;
      scales: keyof CartesianScaleTypeRegistry;
    };
  }
}
