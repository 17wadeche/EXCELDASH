// src/taskpane/components/GanttChart.tsx
import React, { useRef, useEffect } from 'react';
import { CanvasGantt, SVGGantt, StrGantt } from '../../lib/gantt.js'; // Adjust the path as necessary
import '../../styles/gantt.css'; // Import CSS if required

interface GanttChartProps {
  data: GanttWidgetData;
  options?: any; // Define appropriate type based on your Gantt chart options
  type?: 'canvas' | 'svg' | 'string';
}

const GanttChart: React.FC<GanttChartProps> = ({ data, options = {}, type = 'canvas' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null); // Replace 'any' with appropriate type if available

  useEffect(() => {
    if (containerRef.current) {
      // Instantiate the appropriate Gantt chart class based on the 'type' prop
      switch (type) {
        case 'svg':
          ganttInstance.current = new SVGGantt(containerRef.current, data, options);
          break;
        case 'string':
          ganttInstance.current = new StrGantt(data, options);
          break;
        case 'canvas':
        default:
          ganttInstance.current = new CanvasGantt(containerRef.current, data, options);
          break;
      }
    }

    // Cleanup on component unmount
    return () => {
      if (ganttInstance.current && typeof ganttInstance.current.destroy === 'function') {
        ganttInstance.current.destroy();
      } else if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [data, options, type]);

  useEffect(() => {
    if (ganttInstance.current) {
      // Update the Gantt chart when data or options change
      if (typeof ganttInstance.current.setData === 'function') {
        ganttInstance.current.setData(data);
      }
      if (typeof ganttInstance.current.setOptions === 'function') {
        ganttInstance.current.setOptions(options);
      }
      if (typeof ganttInstance.current.render === 'function') {
        ganttInstance.current.render();
      }
    }
  }, [data, options, type]);

  return <div ref={containerRef} />;
};

export default GanttChart;
