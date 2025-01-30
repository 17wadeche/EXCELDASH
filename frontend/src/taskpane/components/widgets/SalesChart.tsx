// src/taskpane/components/widgets/SalesChart.tsx

import React, { useRef, useEffect } from "react";
import Draggable from "react-draggable";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  TimeSeriesScale,
  Tooltip,
  Legend,
  TimeScale
} from "chart.js/auto";
import { Bar, Line, Pie, Doughnut, Radar, Scatter, Bubble, PolarArea, Chart as BaseChart } from "react-chartjs-2";
import "chartjs-adapter-moment";
import { BoxPlotController, BoxAndWiskers } from "@sgratzl/chartjs-chart-boxplot";
import zoomPlugin from "chartjs-plugin-zoom";
import { TreemapController, TreemapElement } from "chartjs-chart-treemap";
import { FunnelController, TrapezoidElement } from "chartjs-chart-funnel";
import { HierarchicalScale } from "chartjs-plugin-hierarchical";
import type { ChartData, ChartOptions, ChartType, ChartDataset } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  TimeSeriesScale,
  zoomPlugin,
  ChartDataLabels,
  TreemapController,
  TreemapElement,
  FunnelController,
  TrapezoidElement,
  BoxPlotController,
  BoxAndWiskers,
  HierarchicalScale,
  LinearScale,
  PointElement
);

const TreemapChart: React.FC<any> = (props) => {
  return <BaseChart type="treemap" {...props} />;
};

const FunnelChart: React.FC<any> = (props) => {
  return <BaseChart type="funnel" {...props} options={{ ...props.options, plugins: { ...props.options.plugins }, elements: { trapezoid: { width: 0.8, spacing: 2 }}}}/>;
};

const BoxPlotChart: React.FC<any> = (props) => {
  return <BaseChart type="boxplot" {...props} />;
};

const chartComponents: Record<string, React.FC<any>> = {
  bar: Bar,
  line: Line,
  pie: Pie,
  doughnut: Doughnut,
  radar: Radar,
  scatter: Scatter,
  bubble: Bubble,
  polarArea: PolarArea,
  treemap: TreemapChart,
  funnel: FunnelChart,
  boxplot: BoxPlotChart,
};

interface ExtendedChartData<TType extends ChartType = ChartType, TData = unknown> extends ChartData<TType, TData> {
  title?: string;
  titleAlignment?: "left" | "center" | "right";
  scales?: {
    x?: {
      type?: "category" | "linear" | "logarithmic" | "time";
      title?: {
        display?: boolean;
        text?: string;
      };
    };
    y?: {
      type?: "category" | "linear" | "logarithmic";
      title?: {
        display?: boolean;
        text?: string;
      };
    };
    y1?: {
      type?: "category" | "linear" | "logarithmic";
      display?: boolean;
      position?: "left" | "right";
      title?: {
        display?: boolean;
        text?: string;
      };
    };
  };
  plugins?: {
    legend?: {
      display?: boolean;
      position?: "top" | "left" | "bottom" | "right";
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
  associatedRange?: string;
  chartIndex?: number;
}

interface SalesChartProps {
  data: ExtendedChartData;
  type: ChartType | string;
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
  console.log("SalesChart Datasets:", data.datasets);
  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!data.title,
        text: data.title || "Chart",
        color: "#000",
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
        position: data.plugins?.legend?.position || "top",
        labels: {
          color: "black",
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
        type: type === "candlestick" ? "time" : data.scales?.x?.type || "category",
        time:
          type === "candlestick"
            ? {
                unit: "day",
                tooltipFormat: "ll",
                parser: "YYYY-MM-DD",
              }
            : data.scales?.x?.type === "time"
              ? { unit: "day" }
              : undefined,
        title: {
          display: data.scales?.x?.title?.display !== false,
          text: data.scales?.x?.title?.text || "",
          color: "#000",
        },
        ticks: {
          color: "black",
          autoSkip: false,
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          color: data.gridLineColor || "rgba(0, 0, 0, 0.2)",
        },
      },
      y: {
        type: data.scales?.y?.type || "linear",
        position: "left",
        title: {
          display: data.scales?.y?.title?.display !== false,
          text: data.scales?.y?.title?.text || "",
          color: "#000",
        },
        ticks: {
          color: "black",
          callback: (value: number | string) => Number(value).toLocaleString(),
        },
        grid: {
          color: data.gridLineColor || "rgba(0, 0, 0, 0.2)",
        },
      },
      y1: {
        type: data.scales?.y1?.type || "linear",
        position: data.scales?.y1?.position || "right",
        display: data.scales?.y1?.display || false,
        title: {
          display: data.scales?.y1?.title?.display !== false,
          text: data.scales?.y1?.title?.text || "",
          color: "#000",
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "black",
        },
      },
    },
  };

  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const chart = chartRef.current;
    if (!chart) return;
    const elements = chart.getElementsAtEventForMode(event.nativeEvent, "nearest", { intersect: true }, true);
    if (elements.length > 0) {
      const datasetIndex = elements[0].datasetIndex;
      const dataIndex = elements[0].index;
      const dataValue = chart.data.datasets[datasetIndex].data[dataIndex];
      console.log(`Clicked on data point: ${dataValue}`);
    }
  };

  const noAxisTypes = ["pie", "doughnut", "radar", "polarArea", "treemap", "funnel"];
  if (noAxisTypes.includes(type)) {
    chartOptions.scales = {};
  }
  const SelectedChart = chartComponents[type] || Bar;
  return (
    <Draggable handle=".drag-handle">
      <div
        className="drag-handle"
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          margin: 0,
          padding: 0,
          overflow: "hidden",
          backgroundColor: data.backgroundColor || "white",
          cursor: "move",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SelectedChart data={data} options={chartOptions} ref={chartRef} onClick={handleChartClick} />
        </div>
      </div>
    </Draggable>
  );
};

export default React.memo(SalesChart);
