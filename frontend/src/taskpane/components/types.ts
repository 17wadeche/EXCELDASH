// src/taskpane/components/types.ts

import { ColumnType } from 'antd/lib/table/interface';
import { TdHTMLAttributes } from 'react';
import { ChartType, ChartOptions, LegendOptions, TooltipOptions, ChartDataset, DefaultDataPoint } from 'chart.js';
import { Layout } from 'react-grid-layout';

// Define Widget Types
export type WidgetType = 'title' | 'text' | 'chart' | 'gantt' | 'image' | 'metric' | 'report' | 'line';

export interface TitleWidgetData {
  content: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  titleAlignment: 'left' | 'center' | 'right';
}

export interface WidgetBase {
  id: string;
  type: WidgetType;
}

export interface TextWidget extends WidgetBase {
  type: 'text';
  data: TextData;
}

export interface LineWidgetData {
  color: string;
  thickness: number;
  style: 'solid' | 'dashed' | 'dotted';
  orientation: 'horizontal' | 'vertical';
}

export interface ChartWidget extends WidgetBase {
  type: 'chart';
  data: ChartData;
}

export interface GanttWidget extends WidgetBase {
  type: 'gantt';
  data: GanttWidgetData;
}

export interface ImageWidget extends WidgetBase {
  type: 'image';
  data: ImageWidgetData;
}

export interface MetricWidget extends WidgetBase {
  type: 'metric';
  data: MetricData;
}

export interface ReportWidgetType extends WidgetBase {
  type: 'report';
  name: string; // Ensure 'name' is included
  data: ReportData;
}

export interface LineWidget extends WidgetBase {
  type: 'line';
  data: LineWidgetData;
}

export interface TitleWidget extends WidgetBase {
  type: 'title';
  data: TitleWidgetData;
}

// Union Type for Widget
export type Widget =
  | TitleWidget
  | TextWidget
  | ChartWidget
  | GanttWidget
  | ImageWidget
  | MetricWidget
  | ReportWidgetType
  | LineWidget;


// Widget Data Types
export type WidgetData<T extends WidgetType> =
  T extends 'title' ? TitleWidgetData :
  T extends 'text' ? TextData :
  T extends 'chart' ? ChartData :
  T extends 'gantt' ? GanttWidgetData :
  T extends 'image' ? ImageWidgetData :
  T extends 'metric' ? MetricData :
  T extends 'report' ? ReportData :
  T extends 'line' ? ReportData :
  never;

// Metric Widget Data
export interface MetricData {
  worksheetName: string;
  cellAddress: string;
  targetValue: number;
  comparison: 'greater' | 'less';
  displayName: string;
  format: 'percentage' | 'currency' | 'number';
  currentValue: number;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  titleAlignment: 'left' | 'center'| 'right';
}

// Report Item Interface
export interface ReportItem {
  id: string;
  name: string;
  data: ReportData;
  workbookId: string;
}

export interface ReportColumn<T> extends Omit<ColumnType<T>, 'title'> {
  dataIndex: string;
  key: string | number;
  title: string; // Ensure title is always a string
}

export interface ReportData<T = Record<string, any>> {
  columns: ReportColumn<T>[];
  data: T[];
}

export interface TextData {
  content: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  titleAlignment: 'left' | 'center' | 'right';
}

export interface Task {
  id: string;
  name: string;
  start: string; // 'YYYY-MM-DD' format
  end: string;   // 'YYYY-MM-DD' format
  progress: number; // Between 0 and 100
  dependencies?: string; // Comma-separated IDs of dependencies
  custom_class?: string; // Optional CSS class
  type?: string; // Add this if you are using it
  color?: string;
}

// Gantt Widget Data Interface
export interface GanttWidgetData {
  tasks: Task[];
  ganttTitle?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

// Chart Data Interface
export interface ChartData {
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  type: ChartType;
  labels: string[];
  scales?: {
    x?: {
      type?: 'category' | 'linear' | 'logarithmic'| 'time';
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
  locale?: string;
  associatedRange: string; // e.g., "A1:B10"
  worksheetName: string;
  chartIndex?: number;
  datasets: ChartDataset<'line'>[];
  dynamicUpdate?: {
    enabled?: boolean;
    interval?: number;
  };
  gradientFills?: {
    enabled?: boolean;
    startColor?: string;
    endColor?: string;
  };
}

// Chart Widget Interface
export interface ChartWidget {
  id: string;
  type: 'chart';
  data: ChartData;
}

export interface DashboardBorderSettings {
  showBorder: boolean;
  color: string;
  thickness: number; // in pixels
  style: 'solid' | 'dashed' | 'dotted';
}

// Image Widget Data Interface
export interface ImageWidgetData {
  src: string;
}

// Export Chart Types
export { ChartType, ChartDataset };

// Component Data Type
export type ComponentData = TextData | ChartData | GanttWidgetData;

// Dashboard Component Interface
export interface DashboardComponent {
  id: string;
  type: 'gantt' | 'chart' | 'text' | 'image'| 'metric' | 'report' | 'line';
  data: WidgetData<WidgetType>;
}

// Grid Layout Item Type
export type GridLayoutItem = Layout;

// Dashboard Item Interface
export interface DashboardItem {
  id: string;
  title: string;
  components: Widget[];
  layouts?: { [key: string]: GridLayoutItem[] };
  versions?: DashboardVersion[];
  workbookId?: string;
}

// Dashboard Version Interface
export interface DashboardVersion {
  id: string;
  timestamp: string;
  title: string;
  components: Widget[];
  layouts: { [key: string]: GridLayoutItem[] };
}

// Dataset Interface
export interface Dataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
}
