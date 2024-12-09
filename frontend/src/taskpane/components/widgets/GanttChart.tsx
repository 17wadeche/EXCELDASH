// src/taskpane/components/widgets/GanttChartComponent.tsx

import React, { useState, useEffect } from 'react';
import { Row, Col } from 'antd';
import { FrappeGantt } from 'react-frappe-gantt';
import { Task } from '../types';
import {
  Select,
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  message,
} from 'antd';
import Draggable from 'react-draggable';
import { v4 as uuidv4 } from 'uuid';
import '../../../frappe-gantt.css';
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
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const rowHeight = 20;

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
  return (
    <div
      className="gantt-chart-container"
      style={{
        width: '100%',
        height: `600px`,
        position: 'relative',
      }}
    >
      <div
        className="gantt-header drag-handle"
        style={{
          width: '100%',
          textAlign: titleAlignment,
          cursor: 'move',
          padding: '10px 0',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #ddd',
          marginBottom: '10px',
        }}
      >
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
        <Col></Col>
      </Row>
      <div className="gantt-chart-wrapper">
        <FrappeGantt
          tasks={tasks}
          viewMode={viewMode}
          onClick={handleClick}
          onDateChange={handleDateChange}
          onProgressChange={handleProgressChange}
        />
      </div>
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
