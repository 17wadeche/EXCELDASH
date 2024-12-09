// src/taskpane/components/widgets/GanttChartComponent.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Row, Col } from 'antd';
import { FrappeGantt } from 'react-frappe-gantt';
import { Task } from '../types';
import {
  Select,
  Button,
  message
} from 'antd';
import { v4 as uuidv4 } from 'uuid';
import './GanttChart.css';
import AddTaskForm from './AddTaskForm';

const { Option } = Select;

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
  
  // For tooltip logic
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // For drag-to-scroll logic
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const scrollTopRef = useRef<number>(0);

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
      if (isDraggingRef.current && wrapperRef.current) {
        const dx = event.clientX - startXRef.current;
        const dy = event.clientY - startYRef.current;
        wrapperRef.current.scrollLeft = scrollLeftRef.current - dx;
        wrapperRef.current.scrollTop = scrollTopRef.current - dy;
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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

  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);

  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (wrapperRef.current) {
      isDraggingRef.current = true;
      startXRef.current = event.clientX;
      startYRef.current = event.clientY;
      scrollLeftRef.current = wrapperRef.current.scrollLeft;
      scrollTopRef.current = wrapperRef.current.scrollTop;
    }
  };

  return (
    <div className="gantt-chart-container">
      <div className="gantt-header" style={{ textAlign: titleAlignment }}>
        <strong>{title}</strong>
      </div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
        <Col>
          <Select
            value={viewMode}
            onChange={(value: 'Day' | 'Week' | 'Month') => setViewMode(value)}
            style={{ width: 120 }}
          >
            <Option value="Day">Day</Option>
            <Option value="Week">Week</Option>
            <Option value="Month">Month</Option>
          </Select>
        </Col>
        <Col>
          <Button type="primary" onClick={() => setAddTaskModalVisible(true)}>
            Add Task
          </Button>
        </Col>
      </Row>
      <div 
        className="gantt-chart-wrapper" 
        ref={wrapperRef} 
        onMouseDown={onMouseDown}
      >
        <div className="gantt-inner-wrapper">
          <FrappeGantt
            tasks={tasks}
            viewMode={viewMode}
            onClick={handleClick}
            onDateChange={handleDateChange}
            onProgressChange={handleProgressChange}
          />
        </div>
      </div>
      <AddTaskForm
        visible={addTaskModalVisible}
        onCreate={handleAddTask}
        onCancel={() => setAddTaskModalVisible(false)}
        existingTasks={tasks}
      />
    </div>
  );
};

export default GanttChartComponent;
