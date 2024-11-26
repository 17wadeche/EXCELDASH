declare module 'frappe-gantt-react' {
    import { Component } from 'react';
  
    interface Task {
      id: string;
      name: string;
      start: string;
      end: string;
      progress: number;
      dependencies?: string;
      custom_class?: string;
    }
  
    interface GanttProps {
      tasks: Task[];
      viewMode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month';
      onClick?: (task: Task) => void;
      onDateChange?: (task: Task) => void;
      onProgressChange?: (task: Task) => void;
      onTasksChange?: (tasks: Task[]) => void;
    }
  
    export class FrappeGantt extends Component<GanttProps> {}
    export type { Task };
  }
  