declare module 'react-frappe-gantt' {
  import { Component } from 'react';

  export type ViewMode = 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month';

  export interface Task {
    id: string;
    name: string;
    start: string; // 'YYYY-MM-DD' or ISO string
    end: string;   // 'YYYY-MM-DD' or ISO string
    progress: number; // 0 to 100
    dependencies?: string;
    custom_class?: string;
  }

  interface FrappeGanttProps {
    tasks: Task[];
    viewMode?: ViewMode;
    onClick?: (task: Task) => void;
    onDateChange?: (task: Task, start: Date, end: Date) => void;
    onProgressChange?: (task: Task, progress: number) => void;
    onTasksChange?: (tasks: Task[]) => void;
    arrow_color?: string;
  }

  export class FrappeGantt extends Component<FrappeGanttProps> {}
}
