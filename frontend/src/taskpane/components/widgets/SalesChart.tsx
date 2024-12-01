// src/taskpane/components/widgets/SalesChart.tsx

import React, { useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Chart as ChartJS } from 'chart.js/auto';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-moment'; // Ensure the adapter is imported
import zoomPlugin from 'chartjs-plugin-zoom';
import isEqual from 'lodash/isEqual';
import type {
  ChartData,
  ChartOptions,
  ChartDataset,
  ChartType,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(zoomPlugin);
ChartJS.register(ChartDataLabels);
interface ExtendedChartData<TType extends ChartType = ChartType, TData = unknown> extends ChartData<TType, TData> {
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  scales?: {
    x?: {
      type?: 'category' | 'linear' | 'logarithmic' | 'time'; // Include 'time'
      title?: {
        display?: boolean;
        text?: string;
      };
    };
    y?: {
      type?: 'category' | 'linear' | 'logarithmic';
      title?: {
        display?: boolean;
        text?: string;
      };
    };
    y1?: {
      type?: 'category' | 'linear' | 'logarithmic';
      display?: boolean;
      position?: 'left' | 'right';
      title?: {
        display?: boolean;
        text?: string;
      };
    };
  };
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'left' | 'bottom' | 'right';
    };
    tooltip?: {
      enabled?: boolean;
      callbacks?: any;
    };
    zoom?: any;
    annotation?: any;
    datalabels?: any;
  };
  backgroundColor?: string;
  gridLineColor?: string;
  datasets: ChartDataset<TType, TData>[];
  associatedRange?: string; // Added property
  chartIndex?: number; // Existing property
}

interface SalesChartProps {
  data: ExtendedChartData;
  type: ChartType;
  isPresenterMode?: boolean;
}

const SalesChart = ({ data, type }: SalesChartProps) => {
  const chartRef = useRef<ChartJS>(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!data.title,
        text: data.title || 'Chart',
        color: '#000',
        font: {
          size: 18,
        },
      },
      tooltip: {
        enabled: data.plugins?.tooltip?.enabled !== false,
        callbacks: data.plugins?.tooltip?.callbacks || {},
      },
      legend: {
        display: data.plugins?.legend?.display !== false,
        position: data.plugins?.legend?.position || 'top',
        labels: {
          color: 'black',
          font: {
            size: 14,
          },
        },
      },
      zoom: data.plugins?.zoom || {},
      annotation: data.plugins?.annotation || {},
      datalabels: data.plugins?.datalabels || {},
    },
    scales: {
      x: {
        type: data.scales?.x?.type || 'category',
        time: data.scales?.x?.type === 'time' ? {
          unit: 'day', // Adjust based on your data granularity
        } : undefined,
        title: {
          display: data.scales?.x?.title?.display !== false,
          text: data.scales?.x?.title?.text || '',
          color: '#000',
        },
        ticks: {
          color: 'black',
          autoSkip: false,
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          color: data.gridLineColor || 'rgba(0, 0, 0, 0.2)',
        },
      },
      y: {
        type: data.scales?.y?.type || 'linear',
        position: 'left',
        title: {
          display: data.scales?.y?.title?.display !== false,
          text: data.scales?.y?.title?.text || '',
          color: '#000',
        },
        ticks: {
          color: 'black',
          callback: (value: number | string) => Number(value).toLocaleString(),
        },
        grid: {
          color: data.gridLineColor || 'rgba(0, 0, 0, 0.2)',
        },
      },
      y1: {
        type: data.scales?.y1?.type || 'linear',
        position: data.scales?.y1?.position || 'right',
        display: data.scales?.y1?.display || false,
        title: {
          display: data.scales?.y1?.title?.display !== false,
          text: data.scales?.y1?.title?.text || '',
          color: '#000',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'black',
        },
      },
    },
  };

  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const chart = chartRef.current;
    if (!chart) return;
    const elements = chart.getElementsAtEventForMode(
      event.nativeEvent,
      'nearest',
      { intersect: true },
      true
    );
    if (elements.length > 0) {
      const datasetIndex = elements[0].datasetIndex;
      const dataIndex = elements[0].index;
      const dataValue = chart.data.datasets[datasetIndex].data[dataIndex];
      console.log(`Clicked on data point: ${dataValue}`);
    }
  };

  return (
    <Draggable handle=".drag-handle">
      <div
        className="drag-handle"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: data.backgroundColor || 'white',
          cursor: 'move',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Chart
            type={type}
            data={data}
            options={chartOptions}
            ref={chartRef}
            onClick={handleChartClick}
          />
        </div>
      </div>
    </Draggable>
  );
};

export default React.memo(SalesChart);
