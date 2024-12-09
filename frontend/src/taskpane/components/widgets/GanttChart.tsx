// src/taskpane/components/widgets/GanttChartComponent.tsx
import React, { useState, useEffect } from 'react';
import { Row, Col } from 'antd';
import { FrappeGantt } from 'react-frappe-gantt';
import { Task } from '../types';
import { Select, Button, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import '../Dashboard.css';
import AddTaskForm from './AddTaskForm';
import Draggable from 'react-draggable';

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
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleDateChange = (task: Task, start: Date, end: Date) => {
    const updatedTasks = tasks.map((t) =>
      t.id === task.id
        ? { ...t, start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
        : t
    );
    setTasks(updatedTasks);
    if (onTasksChange) onTasksChange(updatedTasks);
  };

  const handleProgressChange = (task: Task, progress: number) => {
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, progress } : t
    );
    setTasks(updatedTasks);
    if (onTasksChange) onTasksChange(updatedTasks);
  };

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
    if (onTasksChange) onTasksChange(updatedTasks);
    message.success('Task added successfully!');
  };

  return (
    <Draggable handle=".gantt-header">
      <div
        style={{
          width: '600px',
          height: '600px',
          position: 'relative',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          cursor: 'move',
          border: '1px solid #ddd',
          backgroundColor: '#fff',
        }}
      >
        <div className="gantt-header" style={{ textAlign: titleAlignment, background: '#f0f0f0', padding: '8px' }}>
          <strong>{title}</strong>
        </div>
        <Row justify="space-between" align="middle" style={{ marginBottom: '20px', padding: '8px' }}>
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
        <div className="gantt-chart-wrapper" style={{ overflowX: 'auto', overflowY: 'auto', padding: '8px' }}>
          <div style={{ minWidth: '2000px', height: '600px' }}>
            <FrappeGantt
              tasks={tasks}
              viewMode={viewMode}
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
    </Draggable>
  );
};

export default GanttChartComponent;
