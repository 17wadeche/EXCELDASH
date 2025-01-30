/* eslint-disable no-undef */
// src/taskpane/components/widgets/GanttChartComponent.tsx
import React, { useState, useEffect } from "react";
import { Row, Col } from "antd";
import { FrappeGantt } from "react-frappe-gantt";
import { Task } from "../types";
import { Select, Button } from "antd";
import "../Dashboard.css";
import AddTaskForm from "./AddTaskForm";

const { Option } = Select;

interface GanttChartComponentProps {
  tasks: Task[];
  onTasksChange?: (updatedTasks: Task[]) => void;
  titleAlignment?: "left" | "center";
  title?: string;
  arrowColor?: string;
  defaultProgressColor?: string;
}

const GanttChartComponent: React.FC<GanttChartComponentProps> = ({
  tasks: initialTasks,
  onTasksChange,
  titleAlignment = "left",
  title = "Gantt Chart",
  arrowColor = "#7d7d7d",
  defaultProgressColor = "#1890ff",
}) => {
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Week");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const injectTaskColors = (tasks: Task[]) => {
    const styleElementId = "gantt-task-colors";
    let styleElement = document.getElementById(styleElementId) as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = document.createElement("style") as HTMLStyleElement;
      styleElement.id = styleElementId;
      document.head.appendChild(styleElement);
    }
    if (styleElement.sheet) {
      while (styleElement.sheet.cssRules.length > 0) {
        styleElement.sheet.deleteRule(0);
      }
    }
    const updatedTasks = tasks.map((task) => {
      if (!task.id) return task;
      const className = `task-${task.id}`;
      if (task.color) {
        const ruleBar = `
          .${className} .bar {
            fill: ${task.color} !important;
          }
        `;
        styleElement.sheet?.insertRule(ruleBar, styleElement.sheet.cssRules.length);
      }
      const progressColor = task.progressColor || defaultProgressColor;
      if (progressColor) {
        const ruleBarProgress = `
          .${className} .bar-progress {
            fill: ${progressColor} !important;
          }
        `;
        styleElement.sheet?.insertRule(ruleBarProgress, styleElement.sheet.cssRules.length);
      }
      return {
        ...task,
        custom_class: className,
      };
    });
    setTasks(updatedTasks);
  };

  useEffect(() => {
    injectTaskColors(tasks);
  }, [tasks, defaultProgressColor]);

  const handleDateChange = (task: Task, start: Date, end: Date) => {
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] } : t
    );
    setTasks(updatedTasks);
    if (onTasksChange) onTasksChange(updatedTasks);
  };

  const handleProgressChange = (task: Task, progress: number) => {
    const updatedTasks = tasks.map((t) => (t.id === task.id ? { ...t, progress } : t));
    setTasks(updatedTasks);
    if (onTasksChange) onTasksChange(updatedTasks);
  };

  return (
    <div
      className="gantt-chart-container"
      style={{
        width: "100%",
        height: "100%",
        padding: "8px",
        overflow: "hidden",
        border: "1px solid #ddd",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
        position: "relative", // Ensure relative positioning for internal elements
      }}
    >
      {/* Drag Handle */}
      <div
        className="drag-handle"
        style={{
          textAlign: titleAlignment,
          background: "#f0f0f0",
          padding: "8px",
          cursor: "move", // Indicate draggable area
          borderBottom: "1px solid #ddd",
          borderRadius: "8px 8px 0 0",
          userSelect: "none", // Prevent text selection during drag
        }}
      >
        <strong>{title}</strong>
      </div>
      <Row justify="space-between" align="middle" style={{ margin: "16px 0", padding: "0 8px" }}>
        <Col>
          <Select
            value={viewMode}
            onChange={(value: "Day" | "Week" | "Month") => setViewMode(value)}
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
        style={{
          overflowX: "auto",
          overflowY: "auto",
          padding: "0 8px",
          height: "calc(100% - 100px)",
        }}
      >
        <div style={{ minWidth: "2000px", height: "600px" }}>
          <FrappeGantt
            tasks={tasks}
            viewMode={viewMode}
            onDateChange={handleDateChange}
            onProgressChange={handleProgressChange}
            arrow_color={arrowColor}
          />
        </div>
      </div>
      <AddTaskForm visible={addTaskModalVisible} onCancel={() => setAddTaskModalVisible(false)} />
    </div>
  );
};

export default GanttChartComponent;
