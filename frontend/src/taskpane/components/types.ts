// src/taskpane/components/types.ts

import { ColumnType } from 'antd/lib/table/interface';
import { TdHTMLAttributes } from 'react';
import { ChartType, ChartOptions, LegendOptions, TooltipOptions, ChartDataset, DefaultDataPoint } from 'chart.js';
import { Layout } from 'react-grid-layout';

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
  name: string;
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

export type Widget =
  | TitleWidget
  | TextWidget
  | ChartWidget
  | GanttWidget
  | ImageWidget
  | MetricWidget
  | ReportWidgetType
  | LineWidget;


export type WidgetData<T extends WidgetType> =
  T extends 'title' ? TitleWidgetData :
  T extends 'text' ? TextData :
  T extends 'chart' ? ChartData :
  T extends 'gantt' ? GanttWidgetData :
  T extends 'image' ? ImageWidgetData :
  T extends 'metric' ? MetricData :
  T extends 'report' ? ReportData :
  T extends 'line' ? LineWidgetData :
  never;

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

export interface ReportItem {
  id: string;
  name: string;
  data: ReportData;
  workbookId: string;
}

export interface ReportColumn<T> extends Omit<ColumnType<T>, 'title'> {
  dataIndex: string;
  key: string | number;
  title: string;
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
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class?: string;
  type?: string;
  color?: string;
}

export interface GanttWidgetData {
  tasks: Task[];
  title: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

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
  associatedRange: string;
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

export interface DashboardBorderSettings {
  showBorder: boolean;
  color: string;
  thickness: number;
  style: 'solid' | 'dashed' | 'dotted';
}
export interface ImageWidgetData {
  src: string;
}

export { ChartType, ChartDataset };

export type ComponentData = TextData | ChartData | GanttWidgetData;
export interface DashboardComponent {
  id: string;
  type: 'gantt' | 'chart' | 'text' | 'image'| 'metric' | 'report' | 'line';
  data: WidgetData<WidgetType>;
}
export type GridLayoutItem = Layout;
export interface DashboardItem {
  id: string;
  title: string;
  components: Widget[];
  layouts?: { [key: string]: GridLayoutItem[] };
  versions?: DashboardVersion[];
  workbookId?: string;
}
export interface DashboardVersion {
  id: string;
  timestamp: string;
  title: string;
  components: Widget[];
  layouts: { [key: string]: GridLayoutItem[] };
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface TemplateItem {
  id?: string;
  name: string;
  content: string;
}