// src/taskpane/utils/ChartConfig.ts

import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  BarController,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from 'chart.js';

// Register necessary components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  BarController,
  Tooltip,
  Legend,
  Filler
);
