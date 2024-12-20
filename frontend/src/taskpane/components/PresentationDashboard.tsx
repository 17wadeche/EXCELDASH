// src/taskpane/components/PresentationDashboard.tsx

import React, { useContext } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { DashboardContext } from '../context/DashboardContext';
import { GRID_COLS } from './layoutConstants';
import './PresentationDashboard.css';
import TextWidget from './widgets/TextWidget';
import SalesChart from './widgets/SalesChart';
import MetricWidget from './widgets/MetricWidget';
import ImageWidget from './widgets/ImageWidget';
import LineWidget from './widgets/LineWidget';
import GanttChartComponent from './widgets/GanttChart';
import ReportWidget from './widgets/ReportWidget';
import {
  ReportData,
  ReportWidgetType,
  GanttWidgetData,
  LineWidgetData,
  MetricData,
  ChartData,
  TextData,
  ImageWidgetData,
} from './types';

const ResponsiveGridLayout = WidthProvider(Responsive);

const PresentationDashboard: React.FC = () => {
  const { widgets, layouts, dashboardBorderSettings } = useContext(DashboardContext)!;

  const borderStyle: React.CSSProperties = dashboardBorderSettings?.showBorder
    ? {
        border: `${dashboardBorderSettings.thickness}px ${dashboardBorderSettings.style} ${dashboardBorderSettings.color}`,
      }
    : {};

  return (
    <div id="dashboard-container" className="presentation-dashboard-wrapper" style={borderStyle}>
      <div className="presentation-container">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ xxl: 1920, xl: 1600, lg: 1200, md: 996, sm: 768 }}
          cols={GRID_COLS}
          rowHeight={10}
          isDraggable={false}
          isResizable={false}
          compactType={null}
          preventCollision={false}
          allowOverlap={false}
          margin={[0, 0]}
          containerPadding={[2, 2]}
        >
          {widgets.map((widget) => {
            switch (widget.type) {
              case 'text':
                return (
                  <div key={widget.id} className="grid-item">
                    <TextWidget data={widget.data as TextData} />
                  </div>
                );
              case 'chart':
                return (
                  <div key={widget.id} className="grid-item">
                    <SalesChart
                      data={widget.data as ChartData}
                      type={(widget.data as ChartData).type}
                    />
                  </div>
                );
              case 'metric':
                return (
                  <div key={widget.id} className="grid-item">
                    <MetricWidget id={widget.id} data={widget.data as MetricData} />
                  </div>
                );
              case 'image':
                return (
                  <div key={widget.id} className="grid-item">
                    <ImageWidget data={widget.data as ImageWidgetData} />
                  </div>
                );
              case 'line':
                return (
                  <div key={widget.id} className="grid-item">
                    <LineWidget data={widget.data as LineWidgetData} />
                  </div>
                );
              case 'gantt':
                return (
                  <div key={widget.id} className="grid-item">
                    <GanttChartComponent
                      tasks={(widget.data as GanttWidgetData).tasks}
                      title={(widget.data as GanttWidgetData).title}
                    />
                  </div>
                );
              case 'report':
                return (
                  <div key={widget.id} className="grid-item">
                    <ReportWidget
                      id={widget.id}
                      name={(widget as ReportWidgetType).name}
                      data={(widget as ReportWidgetType).data as ReportData}
                      onDelete={() => {
                        /* No delete in presentation mode */
                      }}
                    />
                  </div>
                );
              default:
                return null;
            }
          })}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};

export default PresentationDashboard;
