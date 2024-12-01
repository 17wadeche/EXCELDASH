// src/taskpane/components/widgets/GanttChartComponent.tsx

import React, { useState, useEffect } from 'react';
import { FrappeGantt } from 'react-frappe-gantt';
import { Task } from '../types';
import {
  notification,
  Select,
  Modal,
  Form,
  Input,
  DatePicker,
  Checkbox,
  Button,
  message,
} from 'antd';
import Draggable from 'react-draggable';
import { v4 as uuidv4 } from 'uuid';
import '../../../frappe-gantt.css';
import './GanttChart.css';
import AddTaskForm from './AddTaskFrom';

const { Option } = Select;

const FrappeGanttAny = FrappeGantt as any;

interface GanttChartComponentProps {
  tasks: Task[];
  onTasksChange?: (updatedTasks: Task[]) => void;
  titleAlignment?: 'left' | 'center';
  title?: string;
}

const GanttChartComponent: React.FC<GanttChartComponentProps> = ({
  tasks: initialTasks,
  onTasksChange,
  titleAlignment = 'left',
  title = 'Gantt Chart',
}) => {
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Week');
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const rowHeight = 20; // Adjust this value as needed

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleDateChange = (task: Task, start: Date, end: Date) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    if (onTasksChange) {
      onTasksChange(updatedTasks);
    }
  };

  const handleProgressChange = (task: Task, progress: number) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === task.id) {
        return { ...t, progress };
      }
      return t;
    });
    setTasks(updatedTasks);
    if (onTasksChange) {
      onTasksChange(updatedTasks);
    }
  };

  const handleClick = (task: Task) => {
    // Use the stored mouse position or other means to get `clientX` and `clientY`
    const { x: clientX, y: clientY } = mousePosition;
  
    setTooltipContent(
      <div className="tooltip-content">
        <h5>{task.name}</h5>
        <p>Task started on: {new Date(task.start).toLocaleDateString()}</p>
        <p>Expected to finish by: {new Date(task.end).toLocaleDateString()}</p>
        <p>{task.progress}% completed!</p>
      </div>
    );
    setTooltipPosition({ x: clientX, y: clientY });
    setTooltipVisible(true);
  };

  const handleOutsideClick = () => {
    setTooltipVisible(false);
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
  
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (tooltipVisible) {
      document.addEventListener('click', handleOutsideClick);
    } else {
      document.removeEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [tooltipVisible]);

  const handleAddTask = (values: any) => {
    const newTask: Task = {
      id: uuidv4(),
      name: values.name,
      start: values.start.format('YYYY-MM-DD'),
      end: values.end.format('YYYY-MM-DD'),
      progress: values.progress,
      dependencies: values.dependencies ? values.dependencies.split(',') : [],
      custom_class: values.custom_class ? 'is-important' : '',
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setAddTaskModalVisible(false);
    if (onTasksChange) {
      onTasksChange(updatedTasks);
    }
    message.success('Task added successfully!');
  };
  const handleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prevIds) =>
      prevIds.includes(taskId)
        ? prevIds.filter((id) => id !== taskId)
        : [...prevIds, taskId]
    );
  };

  useEffect(() => {
    const svgElement = document.querySelector('.frappe-gantt svg');
    if (svgElement) {
      const gridBackground = svgElement.querySelector('.grid-background');
      if (gridBackground) {
        const gridHeight = parseFloat(gridBackground.getAttribute('height') || '0');
        svgElement.setAttribute('height', `${gridHeight}`);
        svgElement.setAttribute('viewBox', `0 0 ${svgElement.getAttribute('width')} ${gridHeight}`);
      }
    }
  }, [tasks]);

  return (
    <Draggable handle=".drag-handle">
      <div
        className="gantt-chart-container"
        style={{
          width: '100%',
          height: `${tasks.length * (rowHeight + 10) + 200}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Title Section with Drag Handle and Alignment Option */}
        <div
          className="gantt-header drag-handle"
          style={{
            width: '100%',
            textAlign: titleAlignment,
            cursor: 'move',
            padding: '0px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #ddd',
            marginBottom: '0px',
          }}
        >
          <strong>{title}</strong>
        </div>

        {/* View Mode Buttons */}
        <div
          style={{
            marginBottom: '0px',
            display: 'flex',
            gap: '0px',
            alignSelf:
              titleAlignment === 'center' ? 'center' : 'flex-start',
          }}
        >
          <Button onClick={() => setViewMode('Day')}>Day</Button>
          <Button onClick={() => setViewMode('Week')}>Week</Button>
          <Button onClick={() => setViewMode('Month')}>Month</Button>
        </div>

        {/* Add and Delete Task Buttons */}
        <div
          style={{
            marginBottom: '0px',
            display: 'flex',
            gap: '0px',
            alignSelf:
              titleAlignment === 'center' ? 'center' : 'flex-start',
          }}
        >
        </div>

        {/* Task Selection for Deletion */}
        <div
          style={{
            marginBottom: '0px',
            maxHeight: '150px',
            overflowY: 'auto',
          }}
        >
          {tasks.map((task) => (
            <div key={task.id}>
              <Checkbox
                checked={selectedTaskIds.includes(task.id)}
                onChange={() => handleTaskSelection(task.id)}
              >
                {task.name}
              </Checkbox>
            </div>
          ))}
        </div>

        {/* Gantt Chart */}
        <div className="gantt-chart-wrapper" style={{ width: '100%', height: '100%' }}>
          <FrappeGantt
            tasks={tasks}
            viewMode={viewMode}
            onClick={handleClick}
            onDateChange={handleDateChange}
            onProgressChange={handleProgressChange}
          />
        </div>

        {/* Tooltip */}
        {tooltipVisible && (
          <div
            className="custom-tooltip"
            style={{
              position: 'absolute',
              top: tooltipPosition.y - 100,
              left: tooltipPosition.x - 100,
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              padding: '8px',
              zIndex: 1000,
            }}
          >
            {tooltipContent}
          </div>
        )}

        {/* Add Task Modal */}
        <AddTaskForm
          visible={addTaskModalVisible}
          onCreate={handleAddTask}
          onCancel={() => setAddTaskModalVisible(false)}
          existingTasks={tasks}
        />
      </div>
    </Draggable>
  );
};

export default GanttChartComponent;
