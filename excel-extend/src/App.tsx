// src/App.tsx
/// <reference types="office-js" />
import React, { useContext, useState, useEffect, useCallback, createContext, ReactNode } from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { Modal, Button, Input, Form, Select, Switch, DatePicker, Drawer, message, Collapse, Tooltip, Layout, Menu, List, Spin, Typography } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import 'react-quill/dist/quill.snow.css';
import 'antd/dist/reset.css';
import 'frappe-gantt/dist/frappe-gantt.css';
import axios from 'axios';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';
import { FrappeGantt } from 'frappe-gantt-react';
import {
  Chart as ChartJS,
  ChartType as ChartJSType,
  ChartOptions,
  ChartData as ChartJSData,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  PieController,
  DoughnutController,
  RadarController,
  PolarAreaController,
  BubbleController,
  ScatterController,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  PieController,
  DoughnutController,
  RadarController,
  PolarAreaController,
  BubbleController,
  ScatterController,
  Title,
  ChartTooltip,
  ChartLegend
);

// Utility Function: ColorUtils
const getRandomColor = (opacity: number = 1): string => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Utility Function: Axios Configuration
const axiosInstance = axios.create({
  baseURL: '/api', // Proxy forwards '/api' to 'http://localhost:5000/api'
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session-based auth
});

// Auth Context and Provider
interface User {
  id: string;
  email: string;
  // Add other relevant fields if necessary
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  token: null,
  setUser: () => {},
  setToken: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  useEffect(() => {
    if (user) {
      console.log('AuthContext - Setting user:', user);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      console.log('AuthContext - Removing user from localStorage');
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      console.log('AuthContext - Setting token:', token);
      localStorage.setItem('token', token);
    } else {
      console.log('AuthContext - Removing token from localStorage');
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook: useAuth
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// PrivateRoute Component
interface PrivateRouteProps {
  children: JSX.Element;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  console.log('PrivateRoute - User:', user);
  console.log('PrivateRoute - Token:', token);

  if (!user || !token) {
    console.log('PrivateRoute - Not authenticated. Redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  console.log('PrivateRoute - Authenticated. Rendering children.');
  return children;
};

// ChartComponents Component
interface ChartComponentsProps {
  type: ChartJSType; // Use ChartType from Chart.js instead of string
  data: ChartJSData<ChartJSType, number[], string>; // Properly typed data
  title: string;
}

const ChartComponents: React.FC<ChartComponentsProps> = ({ type, data, title }) => {
  const options: ChartOptions<ChartJSType> = {
    responsive: true,
    plugins: {
      legend: {
        display: data.datasets.length > 1, // Show legend if multiple datasets
      },
      title: {
        display: true,
        text: title,
      },
    },
  };

  return <Chart type={type} data={data} options={options} />;
};

// DashboardItem Types and Interfaces
type DashboardType = 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'bubble' | 'scatter';

type DashboardItemType = 'chart' | 'gantt' | 'text' | 'existingChart';

interface DatasetItem {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
}

interface Task {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class?: string;
}

interface ChartData {
  type: DashboardType;
  title: string;
  showLegend: boolean;
  labels: string[];
  datasets: DatasetItem[];
}

interface BaseDashboardItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  textColor: string;
  backgroundColor: string;
  fontSize: number;
}

interface TextDashboardItem extends BaseDashboardItem {
  type: 'text';
  content: string;
  data: {}; // No additional data needed for text
}

interface ChartDashboardItem extends BaseDashboardItem {
  type: 'chart';
  content: string;
  data: ChartData;
}

interface GanttDashboardItem extends BaseDashboardItem {
  type: 'gantt';
  content: string;
  data: {
    tasks: Task[];
  };
}

interface ExistingChartDashboardItem extends BaseDashboardItem {
  type: 'existingChart';
  content: string;
  data: {
    imageData: string;
  };
}

type DashboardItem = TextDashboardItem | ChartDashboardItem | GanttDashboardItem | ExistingChartDashboardItem;

// Type Guards
const isGanttDashboardItem = (item: DashboardItem): item is GanttDashboardItem => {
  return item.type === 'gantt';
};

const isChartDashboardItem = (item: DashboardItem): item is ChartDashboardItem => {
  return item.type === 'chart';
};

const isExistingChartDashboardItem = (item: DashboardItem): item is ExistingChartDashboardItem => {
  return item.type === 'existingChart';
};

// Dashboard Component
interface DashboardProps {
  dashboardId: string;
  shared?: boolean;
}

interface DashboardDataType {
  id: string;
  userId: string;
  dashboardItems: DashboardItem[];
  createdAt: string;
}

const Dashboard: React.FC<DashboardProps> = ({ dashboardId, shared = false }) => {
  const { user } = useContext(AuthContext);
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [data, setData] = useState<DashboardDataType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const endpoint = shared ? `/sharedDashboard/${dashboardId}` : `/loadDashboard/${dashboardId}`;

        const response = await axiosInstance.get(endpoint, { withCredentials: !shared });

        const dashboardData: DashboardDataType = response.data;
        setData(dashboardData);
        setDashboardItems(dashboardData.dashboardItems);
      } catch (err: any) {
        setError(err.response?.data?.error || 'An unexpected error occurred');
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [dashboardId, shared]);

  if (loading) {
    return <Spin tip="Loading dashboard..." />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>No dashboard data available.</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {dashboardItems && dashboardItems.length > 0 ? (
        <GridLayout
          className="layout"
          layout={dashboardItems.map((item) => ({
            i: item.i,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          }))}
          cols={12}
          rowHeight={30}
          width={1200}
          isResizable={true}
          isDraggable={true}
          onLayoutChange={(newLayout: any[]) => {
            setDashboardItems((prevItems: DashboardItem[]) =>
              prevItems.map((item: DashboardItem) => {
                const layoutItem = newLayout.find((l) => l.i === item.i);
                return layoutItem
                  ? {
                      ...item,
                      x: layoutItem.x,
                      y: layoutItem.y,
                      w: layoutItem.w,
                      h: layoutItem.h,
                    }
                  : item;
              })
            );
          }}
          resizeHandles={['se', 'sw', 'ne', 'nw']}
          compactType={null}
          preventCollision={false}
        >
          {dashboardItems.map((item) => (
            <div
              key={item.i}
              data-grid={{
                i: item.i,
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h,
                minW: 2,
                minH: item.type === 'text' ? 3 : 2,
              }}
              style={{ position: 'relative' }}
            >
              <div
                style={{
                  border: '1px solid #ccc',
                  padding: '10px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  backgroundColor: item.backgroundColor,
                  color: item.textColor,
                  fontSize: item.fontSize,
                }}
              >
                {item.type === 'text' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    style={{ flexGrow: 1, minHeight: '100px', overflow: 'visible' }}
                    onBlur={(e) => {
                      const sanitizedContent = e.currentTarget.innerText
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                      setDashboardItems((prevItems) =>
                        prevItems.map((i) =>
                          i.i === item.i ? { ...i, content: sanitizedContent } : i
                        )
                      );
                    }}
                  >
                    {item.content}
                  </div>
                ) : isGanttDashboardItem(item) ? (
                  <div style={{ flexGrow: 1 }}>
                    <FrappeGantt
                      tasks={item.data.tasks}
                      viewMode="Week"
                      onDateChange={(task: Task) => {
                        setDashboardItems((prevItems) =>
                          prevItems.map((i) => {
                            if (i.i === item.i && isGanttDashboardItem(i)) {
                              const updatedTasks = i.data.tasks.map((t: Task) =>
                                t.id === task.id ? task : t
                              );
                              return {
                                ...i,
                                data: {
                                  ...i.data,
                                  tasks: updatedTasks,
                                },
                              };
                            }
                            return i;
                          })
                        );
                      }}
                    />
                  </div>
                ) : isExistingChartDashboardItem(item) ? (
                  <div style={{ flexGrow: 1 }}>
                    <img
                      src={`data:image/png;base64,${item.data.imageData}`}
                      alt="Existing Chart"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : isChartDashboardItem(item) ? (
                  <div style={{ flexGrow: 1 }}>
                    <ChartComponents
                      type={item.data.type}
                      data={{
                        labels: item.data.labels,
                        datasets: item.data.datasets,
                      }}
                      title={item.data.title}
                    />
                  </div>
                ) : null}
                {/* Edit and Delete Buttons */}
                <EditDeleteButtons
                  item={item}
                  setDashboardItems={setDashboardItems}
                  getRandomColor={getRandomColor}
                />
              </div>
            </div>
          ))}
        </GridLayout>
      ) : (
        <p>No items to display.</p>
      )}
    </div>
  );
};

// EditDeleteButtons Component
interface EditDeleteButtonsProps {
  item: DashboardItem;
  setDashboardItems: React.Dispatch<React.SetStateAction<DashboardItem[]>>;
  getRandomColor: (opacity?: number) => string;
}

const EditDeleteButtons: React.FC<EditDeleteButtonsProps> = ({ item, setDashboardItems, getRandomColor }) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<DashboardItem | null>(null);

  const handleEdit = () => {
    setEditItem({ ...item });
    setEditModalVisible(true);
  };

  const handleDelete = () => {
    setDashboardItems((prevItems) => prevItems.filter((i) => i.i !== item.i));
    message.success('Item deleted successfully!');
  };

  const handleSaveEdit = () => {
    if (editItem) {
      setDashboardItems((prevItems) =>
        prevItems.map((i) => (i.i === editItem.i ? editItem : i))
      );
      message.success('Item updated successfully!');
    }
    setEditModalVisible(false);
    setEditItem(null);
  };

  return (
    <>
      <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '4px' }}>
        <Button size="small" onClick={handleEdit}>
          Edit
        </Button>
        <Button size="small" danger onClick={handleDelete}>
          Delete
        </Button>
      </div>
      {/* Edit Modal */}
      <Modal
        title="Edit Item"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditItem(null);
        }}
        width={800}
      >
        {editItem && editItem.type === 'text' && (
          <Form layout="vertical">
            <Form.Item label="Text Content">
              <ReactQuill
                value={editItem.content}
                onChange={(value) =>
                  setEditItem({
                    ...editItem,
                    content: value,
                  })
                }
                placeholder="Enter text here..."
              />
            </Form.Item>
            <Form.Item label="Text Color">
              <Input
                type="color"
                value={editItem.textColor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditItem({
                    ...editItem,
                    textColor: e.target.value,
                  })
                }
              />
            </Form.Item>
            <Form.Item label="Background Color">
              <Input
                type="color"
                value={editItem.backgroundColor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditItem({
                    ...editItem,
                    backgroundColor: e.target.value,
                  })
                }
              />
            </Form.Item>
            <Form.Item label="Font Size (px)">
              <Input
                type="number"
                min={8}
                max={48}
                value={editItem.fontSize}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    fontSize: parseInt(e.target.value, 10),
                  })
                }
              />
            </Form.Item>
          </Form>
        )}
        {editItem && editItem.type === 'chart' && (
          <Form layout="vertical">
            <Form.Item label="Chart Title">
              <Input
                value={editItem.data.title}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, title: e.target.value },
                  })
                }
                placeholder="Enter chart title..."
              />
            </Form.Item>
            <Form.Item label="Show Legend">
              <Switch
                checked={editItem.data.showLegend}
                onChange={(checked) =>
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, showLegend: checked },
                  })
                }
              />
            </Form.Item>
            <Form.Item label="Chart Type">
              <Select
                value={editItem.data.type}
                onChange={(value: string) =>
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, type: value as DashboardType },
                  })
                }
              >
                <Select.Option value="line">Line</Select.Option>
                <Select.Option value="bar">Bar</Select.Option>
                <Select.Option value="pie">Pie</Select.Option>
                <Select.Option value="doughnut">Doughnut</Select.Option>
                <Select.Option value="radar">Radar</Select.Option>
                <Select.Option value="polarArea">Polar Area</Select.Option>
                <Select.Option value="bubble">Bubble</Select.Option>
                <Select.Option value="scatter">Scatter</Select.Option>
                {/* Add more chart types as needed */}
              </Select>
            </Form.Item>
            <Form.Item label="Labels (comma-separated)">
              <Input
                value={editItem.data.labels.join(', ')}
                onChange={(e) => {
                  const labels = e.target.value.split(',').map((label) => label.trim());
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, labels },
                  });
                }}
                placeholder="e.g., January, February, March"
              />
            </Form.Item>
            {editItem.data.datasets.map((dataset, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                <Form.Item label={`Dataset Label ${index + 1}`}>
                  <Input
                    value={dataset.label}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditItem({
                        ...editItem,
                        data: {
                          ...editItem.data,
                          datasets: editItem.data.datasets.map((ds, dsIndex) =>
                            dsIndex === index ? { ...ds, label: e.target.value } : ds
                          ),
                        },
                      })
                    }
                    placeholder="Enter dataset label..."
                  />
                </Form.Item>
                <Form.Item label={`Data Values (comma-separated) ${index + 1}`}>
                  <Input
                    value={dataset.data.join(', ')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const data = e.target.value
                        .split(',')
                        .map((value) => parseFloat(value.trim()) || 0);
                      setEditItem({
                        ...editItem,
                        data: {
                          ...editItem.data,
                          datasets: editItem.data.datasets.map((ds, dsIndex) =>
                            dsIndex === index ? { ...ds, data } : ds
                          ),
                        },
                      });
                    }}
                    placeholder="e.g., 10, 20, 30"
                  />
                </Form.Item>
                <Form.Item label={`Dataset Background Color ${index + 1}`}>
                  <Input
                    type="color"
                    value={dataset.backgroundColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditItem({
                        ...editItem,
                        data: {
                          ...editItem.data,
                          datasets: editItem.data.datasets.map((ds, dsIndex) =>
                            dsIndex === index ? { ...ds, backgroundColor: e.target.value } : ds
                          ),
                        },
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label={`Dataset Border Color ${index + 1}`}>
                  <Input
                    type="color"
                    value={dataset.borderColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditItem({
                        ...editItem,
                        data: {
                          ...editItem.data,
                          datasets: editItem.data.datasets.map((ds, dsIndex) =>
                            dsIndex === index ? { ...ds, borderColor: e.target.value } : ds
                          ),
                        },
                      })
                    }
                  />
                </Form.Item>
              </div>
            ))}
            <Button onClick={() => {
              const newDataset: DatasetItem = {
                label: `New Data ${editItem.data.datasets.length + 1}`,
                data: [10, 20, 30],
                backgroundColor: getRandomColor(0.4),
                borderColor: getRandomColor(1),
              };
              setEditItem({
                ...editItem,
                data: {
                  ...editItem.data,
                  datasets: [...editItem.data.datasets, newDataset],
                },
              });
              message.success('Dataset added successfully!');
            }} style={{ marginTop: '10px' }}>
              Add Dataset
            </Button>
          </Form>
        )}
        {editItem && editItem.type === 'gantt' && (
          <Form layout="vertical">
            <Form.Item label="Gantt Tasks">
              {editItem.data.tasks.map((task, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '16px',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                >
                  <Form.Item label="Task Name">
                    <Input
                      value={task.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const tasks = [...editItem.data.tasks];
                        tasks[index].name = e.target.value;
                        setEditItem({
                          ...editItem,
                          data: { ...editItem.data, tasks },
                        });
                      }}
                      placeholder="Enter task name..."
                    />
                  </Form.Item>
                  <Form.Item label="Start Date">
                    <DatePicker
                      value={task.start ? dayjs(task.start) : null}
                      onChange={(date: dayjs.Dayjs | null) => {
                        const tasks = [...editItem.data.tasks];
                        tasks[index].start = date ? date.format('YYYY-MM-DD') : '';
                        setEditItem({
                          ...editItem,
                          data: { ...editItem.data, tasks },
                        });
                      }}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="End Date">
                    <DatePicker
                      value={task.end ? dayjs(task.end) : null}
                      onChange={(date: dayjs.Dayjs | null) => {
                        const tasks = [...editItem.data.tasks];
                        tasks[index].end = date ? date.format('YYYY-MM-DD') : '';
                        setEditItem({
                          ...editItem,
                          data: { ...editItem.data, tasks },
                        });
                      }}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="Progress (%)">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={task.progress}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const progress = parseInt(e.target.value, 10);
                        const tasks = [...editItem.data.tasks];
                        tasks[index].progress = isNaN(progress) ? 0 : progress;
                        setEditItem({
                          ...editItem,
                          data: { ...editItem.data, tasks },
                        });
                      }}
                      placeholder="Enter progress..."
                    />
                  </Form.Item>
                  <Form.Item label="Dependencies (comma-separated IDs)">
                    <Input
                      value={task.dependencies || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const dependencies = e.target.value
                          .split(',')
                          .map((dep) => dep.trim())
                          .filter((dep) => dep !== '');
                        const tasks = [...editItem.data.tasks];
                        tasks[index].dependencies = dependencies.join(',');
                        setEditItem({
                          ...editItem,
                          data: { ...editItem.data, tasks },
                        });
                      }}
                      placeholder="e.g., Task 1, Task 2"
                    />
                  </Form.Item>
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => {
                  const newTaskId = `Task ${editItem.data.tasks.length + 1}`;
                  const newTask: Task = {
                    id: newTaskId,
                    name: `New Task ${editItem.data.tasks.length + 1}`,
                    start: dayjs().format('YYYY-MM-DD'),
                    end: dayjs().add(7, 'day').format('YYYY-MM-DD'),
                    progress: 0,
                    dependencies: '',
                  };
                  setEditItem({
                    ...editItem,
                    data: {
                      ...editItem.data,
                      tasks: [...editItem.data.tasks, newTask],
                    },
                  });
                  message.success('New task added!');
                }}
              >
                Add Task
              </Button>
            </Form.Item>
          </Form>
        )}
      </>
    );
};

// DashboardList Component
interface DashboardListProps {}

interface DashboardListItem {
  id: string;
  title: string;
  createdAt: string;
  // Add other relevant fields
}

const DashboardList: React.FC<DashboardListProps> = () => {
  const { user, token } = useContext(AuthContext);
  const [dashboards, setDashboards] = useState<DashboardListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboards = async () => {
      if (!user || !token) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get('/dashboards', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDashboards(response.data.dashboards);
      } catch (error: any) {
        console.error('Error fetching dashboards:', error);
        message.error('Failed to load dashboards.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [user, token]);

  if (loading) return <Spin tip="Loading Dashboards..." />;

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto' }}>
      <Typography.Title level={2}>Your Dashboards</Typography.Title>
      <List
        bordered
        dataSource={dashboards}
        renderItem={(dashboard) => (
          <List.Item>
            <Link to={`/dashboard/${dashboard.id}`}>{dashboard.title}</Link>
          </List.Item>
        )}
      />
      <Button type="primary" onClick={() => navigate('/create-dashboard')} style={{ marginTop: '20px' }}>
        Create New Dashboard
      </Button>
    </div>
  );
};

// Login Component
const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/login', { email: values.email });
      message.success('Login successful!');

      // Assuming the response contains user and token
      const { user, token } = response.data;
      setUser(user);
      setToken(token);

      navigate('/dashboard'); // Redirect to dashboard after successful login
    } catch (error: any) {
      if (error.response) {
        console.error('Login Error:', error.response.data);
        message.error(error.response.data.error || 'Login failed.');
      } else if (error.request) {
        console.error('Login Error: No response from server.', error.request);
        message.error('No response from server. Please try again later.');
      } else {
        console.error('Login Error:', error.message);
        message.error('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', paddingTop: '100px' }}>
      <Form onFinish={onFinish}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

// Register Component
const Register: React.FC = () => {
  const { setUser, setToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/register', { email: values.email });

      const { user, token, message: successMessage } = response.data;

      // Update AuthContext
      setUser(user);
      setToken(token);

      message.success(successMessage);
      navigate('/dashboard'); // Redirect to dashboard
    } catch (error: any) {
      console.error('Registration Error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else {
        message.error('An unexpected error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', paddingTop: '100px' }}>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email.' },
            { type: 'email', message: 'Please enter a valid email address.' },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Register
          </Button>
        </Form.Item>
        <Form.Item>
          <Button type="link" onClick={() => navigate('/login')} block>
            Already have an account? Login here.
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

// LogoutButton Component
const LogoutButton: React.FC = () => {
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/logout');
      setUser(null);
      setToken(null);
      message.success('Logged out successfully!');
      navigate('/login');
    } catch (error: any) {
      console.error('Logout Error:', error);
      message.error('Failed to logout.');
    }
  };

  return (
    <Button type="link" onClick={handleLogout}>
      Logout
    </Button>
  );
};

// Navigation Component
const { Header, Content, Footer } = Layout;
const { Panel } = Collapse;
const { Option } = Select;
const { Title } = Typography;

const Navigation: React.FC = () => (
  <Menu mode="horizontal">
    <Menu.Item key="dashboard">
      <Link to="/dashboard">Dashboard</Link>
    </Menu.Item>
    <Menu.Item key="logout">
      <LogoutButton />
    </Menu.Item>
  </Menu>
);

// Main App Component
const App: React.FC = () => {
  const { user, token } = useContext(AuthContext);
  console.log('App - User:', user);
  console.log('App - Token:', token);

  // State Management for Dashboard Items
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<DashboardItem | null>(null);
  const [isOfficeInitialized, setIsOfficeInitialized] = useState(false);

  // State for Input Modal
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [inputModalTitle, setInputModalTitle] = useState('');
  const [inputModalCallback, setInputModalCallback] = useState<() => void>(() => {});
  const [inputModalType, setInputModalType] = useState<'range' | 'chart'>('range');
  const [inputValue, setInputValue] = useState('');

  // State for Chart Input
  const [worksheetNames, setWorksheetNames] = useState<string[]>([]);
  const [chartNames, setChartNames] = useState<string[]>([]);
  const [chartSheetName, setChartSheetName] = useState('');
  const [chartName, setChartName] = useState('');

  // State for Excel Data
  const [excelData, setExcelData] = useState<any[][]>([]);

  // State for Drawer Visibility
  const [drawerVisible, setDrawerVisible] = useState(false);

  // State for Sharing Modal
  const [sharingModalVisible, setSharingModalVisible] = useState(false);
  const [dashboardIdInput, setDashboardIdInput] = useState('');
  const [sharedDashboardId, setSharedDashboardId] = useState('');

  // State for Hovered Item
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // State for Email Subscription Modal
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // State for Chart Type Selection Modal
  const [chartTypeModalVisible, setChartTypeModalVisible] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<DashboardType>('line');
  const [chartTypeCallback, setChartTypeCallback] = useState<(type: DashboardType) => void>(() => {});

  // Function to show Chart Type Selection Modal
  const showChartTypeSelectionModal = useCallback((callback: (type: DashboardType) => void) => {
    setChartTypeModalVisible(true);
    setSelectedChartType('line'); // Default selection
    setChartTypeCallback(() => callback);
  }, []);

  // Function to Save Dashboard to Backend (Email)
  const saveDashboardToBackend = (): void => {
    try {
      // Convert the dashboard items to JSON string
      const dashboardJson = JSON.stringify(dashboardItems, null, 2);
      
      // Prepare the mailto link
      const subject = encodeURIComponent('Dashboard Export');
      const body = encodeURIComponent(`Here is the dashboard data:\n\n${dashboardJson}`);
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
  
      // Open the mailto link to prompt the user's email client
      window.location.href = mailtoLink;
      
      message.success('Dashboard prepared for email!');
    } catch (error) {
      console.error('Error preparing dashboard for email:', error);
      message.error('Failed to prepare dashboard for email.');
    }
  };

  // Function to Export Dashboard as JSON
  const exportDashboard = async () => {
    try {
      setSharedDashboardId(Date.now().toString()); // Generate unique ID for export
      setSharingModalVisible(true);
      // Trigger download
      const dataStr = JSON.stringify(dashboardItems, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-${sharedDashboardId}.json`;
      link.click();
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      message.error('Failed to export dashboard.');
    }
  };

  // Function to Import Dashboard from JSON File
  const importDashboard = (file: File) => {
    console.log('Importing dashboard from file:', file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedItems: DashboardItem[] = JSON.parse(e.target?.result as string);
        console.log('Imported dashboard items:', importedItems);
        setDashboardItems(importedItems);
        message.success('Dashboard imported successfully!');
      } catch (error) {
        console.error('Error importing dashboard:', error);
        message.error('Failed to import dashboard. Please check the file format.');
      }
    };
    reader.onerror = (error) => {
      console.error('File reading error:', error);
      message.error('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  // Effect to Initialize Office.js
  useEffect(() => {
    Office.onReady(() => {
      setIsOfficeInitialized(true);
    });
  }, []);

  // Function to Show Input Modal
  const showInputModal = useCallback(
    (title: string, callback: () => void, type: 'range' | 'chart' = 'range') => {
      setInputModalTitle(title);
      setInputModalCallback(() => callback);
      setInputValue('');
      setInputModalType(type);
      setInputModalVisible(true);
    },
    []
  );

  // Function to Show Chart Input Modal
  const showChartInputModal = useCallback((title: string, callback: () => void) => {
    setInputModalTitle(title);
    setInputModalCallback(() => callback);
    setChartSheetName('');
    setChartName('');
    setChartNames([]);
    setInputModalType('chart');
    setInputModalVisible(true);

    // Fetch Worksheet Names
    getWorksheetNames().then((names) => setWorksheetNames(names));
  }, []);

  // Function to Fetch Worksheet Names from Excel
  const getWorksheetNames = async (): Promise<string[]> => {
    try {
      const names = await Excel.run(async (context) => {
        const sheets = context.workbook.worksheets;
        sheets.load('items/name');
        await context.sync();
        return sheets.items.map((sheet) => sheet.name);
      });
      return names;
    } catch (error) {
      console.error('Error getting worksheet names:', error);
      message.error('Failed to fetch worksheet names.');
      return [];
    }
  };

  // Function to Fetch Chart Names from a Worksheet
  const getChartNames = async (sheetName: string): Promise<string[]> => {
    try {
      const chartNames = await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getItem(sheetName);
        const charts = sheet.charts;
        charts.load('items/name');
        await context.sync();
        return charts.items.map((chart) => chart.name);
      });
      return chartNames;
    } catch (error) {
      console.error('Error getting chart names:', error);
      message.error('Failed to fetch chart names.');
      return [];
    }
  };

  // Function to Get Chart Image from Excel
  const getChartImage = async (sheetName: string, chartName: string): Promise<string | null> => {
    if (!isOfficeInitialized) {
      console.error('Office.js is not initialized yet.');
      return null;
    }
    try {
      const image = await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getItem(sheetName);
        const chart = sheet.charts.getItem(chartName);

        // Ensure the chart is loaded
        chart.load(['name', 'type']);
        await context.sync();

        // Get the image as a Base64 string
        const imageResult = chart.getImage(); 
        await context.sync();
        return imageResult.value;
      });
      return image;
    } catch (error) {
      console.error('Error getting chart image:', error);
      message.error('Failed to retrieve chart image.');
      return null;
    }
  };

  // Function to Read Data from Excel Range
  const readDataFromExcelForRange = async (rangeAddress: string): Promise<any[][] | undefined> => {
    if (!isOfficeInitialized) {
      console.error('Office.js is not initialized yet.');
      return [];
    }
    try {
      const data = await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const range = sheet.getRange(rangeAddress);
        range.load('values');
        await context.sync();
        console.log('Data fetched from Excel:', range.values); // Debugging log
        return range.values;
      });
      return data;
    } catch (error) {
      console.error('Error reading data from Excel range:', error);
      message.error('Failed to read data from Excel.');
      return [];
    }
  };

  // Function to Open Range Selection Dialog
  const openRangeSelectionDialog = (): Promise<string> => {
    console.log('Opening range selection dialog...');
    return new Promise((resolve, reject) => {
      Office.context.ui.displayDialogAsync(
        `${window.location.origin}/range-selection.html`,
        { height: 30, width: 20 },
        (result) => {
          console.log('Dialog opened:', result);
          const dialog = result.value;
          dialog.addEventHandler(Office.EventType.DialogMessageReceived, (arg: any) => {
            console.log('Message received from dialog:', arg.message);
            if (arg.message === 'Error') {
              reject(new Error('Failed to select range.'));
            } else {
              resolve(arg.message);
            }
            dialog.close();
          });
        }
      );
    });
  };

  // Function to Subscribe to Emails
  const subscribeToEmails = () => {
    if (!sharedDashboardId) {
      message.error('Please save the dashboard first.');
      return;
    }
    if (!emailInput) {
      message.error('Please enter a valid email address.');
      return;
    }
  
    const emailContent = `Hello,\n\nHere is the link to access the shared dashboard:\nDashboard ID: ${sharedDashboardId}\n\nBest regards,`;
    const emailSubject = 'Weekly Dashboard Update';
  
    generateMailtoLink(emailInput, emailSubject, emailContent);
    message.success('Generated mailto link for sending.');
    setEmailModalVisible(false);
  };

  // Function to Load Dashboard from Backend
  const loadDashboard = async (id: string, shared: boolean = false) => {
    try {
      const endpoint = shared ? `/sharedDashboard/${id}` : `/loadDashboard/${id}`;
      const response = await axiosInstance.get(endpoint, { withCredentials: !shared });
      setDashboardItems(response.data.dashboardItems);
      message.success('Dashboard loaded successfully!');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to load dashboard.';
      message.error(errorMsg);
    }
  };

  // Function to Handle Load Shared Dashboard
  const handleLoadSharedDashboard = useCallback(() => {
    if (dashboardIdInput.trim() !== '') {
      loadDashboard(dashboardIdInput.trim(), true);
      setSharingModalVisible(false);
    } else {
      message.warning('Please enter a valid Dashboard ID.');
    }
  }, [dashboardIdInput]);

  // Function to Generate Mailto Link
  const generateMailtoLink = (recipientEmail: string, subject: string, body: string): void => {
    const mailtoLink = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_self');
  };

  // Function to Handle Loading Dashboard from Modal
  const handleModalOk = useCallback(() => {
    if (sharedDashboardId) {
      setSharingModalVisible(false);
    } else {
      handleLoadSharedDashboard();
    }
  }, [sharedDashboardId, handleLoadSharedDashboard]);

  // Function to Convert Excel Serial Date to JS Date
  const convertExcelDateToJSDate = useCallback((serial: number): Date => {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);

    const fractionalDay = serial - Math.floor(serial) + 0.0000001;

    let totalSeconds = Math.floor(86400 * fractionalDay);

    const seconds = totalSeconds % 60;

    totalSeconds -= seconds;

    const hours = Math.floor(totalSeconds / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);

    return new Date(
      dateInfo.getFullYear(),
      dateInfo.getMonth(),
      dateInfo.getDate(),
      hours,
      minutes,
      seconds
    );
  }, []);

  // Function to Get Current Selection in Excel
  const getCurrentSelection = async (): Promise<string | undefined> => {
    if (!isOfficeInitialized) {
      console.error('Office.js is not initialized yet.');
      return undefined;
    }
    try {
      const rangeAddress = await Excel.run(async (context) => {
        const range = context.workbook.getSelectedRange();
        range.load('address');
        await context.sync();
        return range.address;
      });
      return rangeAddress;
    } catch (error) {
      console.error('Error getting current selection:', error);
      message.error('Failed to get current selection from Excel.');
      return undefined;
    }
  };

  // Function to Handle Adding New Dashboard Items
  const handleAddItem = useCallback(
    async (type: DashboardItemType, useExcelData: boolean = false) => {
      let newItem: DashboardItem;
      if (type === 'chart') {
        if (useExcelData) {
          try {
            const rangeAddress = await getCurrentSelection();
            if (rangeAddress) {
              const data = await readDataFromExcelForRange(rangeAddress);
              if (data && data.length > 0) {
                const labels: string[] = data[0].slice(1);
                const datasets: DatasetItem[] = data.slice(1).map((row: any[]) => ({
                  label: row[0] as string,
                  data: row.slice(1).map((value: any) => parseFloat(value) || 0),
                  backgroundColor: getRandomColor(0.4),
                  borderColor: getRandomColor(1),
                }));

                // Show Chart Type Selection Modal
                showChartTypeSelectionModal((selectedType: DashboardType) => {
                  const chartData: ChartData = {
                    type: selectedType,
                    title: 'Chart from Excel Data',
                    showLegend: true,
                    labels,
                    datasets,
                  };

                  newItem = {
                    i: Date.now().toString(),
                    x: 0,
                    y: Infinity,
                    w: 4,
                    h: 3,
                    type: 'chart',
                    content: '',
                    data: chartData,
                    textColor: '#000000',
                    backgroundColor: '#ffffff',
                    fontSize: 16,
                  };

                  setDashboardItems((prevItems: DashboardItem[]) => [...prevItems, newItem]);
                  message.success('Chart added successfully!');
                });
              } else {
                message.warning('No data returned from Excel.');
              }
            } else {
              message.warning('No range selected.');
            }
          } catch (error) {
            console.error('Error selecting range:', error);
            message.error('Failed to select range.');
          }
          return;
        } else {
          // Sample chart data if Excel data isn't used
          newItem = {
            i: Date.now().toString(),
            x: 0,
            y: Infinity,
            w: 4,
            h: 3,
            type: 'chart',
            content: '',
            data: {
              type: 'line',
              title: 'Sample Line Chart',
              showLegend: true,
              labels: ['January', 'February', 'March', 'April', 'May'],
              datasets: [
                {
                  label: 'Sales',
                  data: [100, 150, 200, 250, 300],
                  backgroundColor: 'rgba(75,192,192,0.4)',
                  borderColor: 'rgba(75,192,192,1)',
                },
                {
                  label: 'Expenses',
                  data: [80, 120, 160, 200, 240],
                  backgroundColor: 'rgba(255,99,132,0.4)',
                  borderColor: 'rgba(255,99,132,1)',
                },
              ],
            },
            textColor: '#000000',
            backgroundColor: '#ffffff',
            fontSize: 16,
          };
        }
      } else if (type === 'gantt') {
        if (useExcelData) {
          try {
            const rangeAddress = await openRangeSelectionDialog();
            if (rangeAddress) {
              const data = await readDataFromExcelForRange(rangeAddress);
              if (data && data.length > 0) {
                const tasks: Task[] = data.map((row) => ({
                  id: row[0].toString(),
                  name: row[1],
                  start: dayjs(convertExcelDateToJSDate(row[2])).format('YYYY-MM-DD'),
                  end: dayjs(convertExcelDateToJSDate(row[3])).format('YYYY-MM-DD'),
                  progress: parseFloat(row[4]) || 0,
                  dependencies: row[5] ? row[5].toString() : '',
                }));

                newItem = {
                  i: Date.now().toString(),
                  x: 0,
                  y: Infinity,
                  w: 6,
                  h: 4,
                  type: 'gantt',
                  content: '',
                  data: {
                    tasks,
                  },
                  textColor: '#000000',
                  backgroundColor: '#ffffff',
                  fontSize: 16,
                };

                setDashboardItems((prevItems: DashboardItem[]) => [...prevItems, newItem]);
                message.success('Gantt chart added successfully!');
              } else {
                message.warning('No data returned from Excel.');
              }
            } else {
              message.warning('No range selected.');
            }
          } catch (error) {
            console.error('Error selecting range:', error);
            message.error('Failed to select range.');
          }
          return;
        } else {
          // Sample Gantt chart data if Excel data isn't used
          newItem = {
            i: Date.now().toString(),
            x: 0,
            y: Infinity,
            w: 6,
            h: 4,
            type: 'gantt',
            content: '',
            data: {
              tasks: [
                {
                  id: 'Task 1',
                  name: 'Design Phase',
                  start: dayjs().format('YYYY-MM-DD'),
                  end: dayjs().add(7, 'day').format('YYYY-MM-DD'),
                  progress: 50,
                  dependencies: '',
                },
                {
                  id: 'Task 2',
                  name: 'Development Phase',
                  start: dayjs().add(8, 'day').format('YYYY-MM-DD'),
                  end: dayjs().add(14, 'day').format('YYYY-MM-DD'),
                  progress: 20,
                  dependencies: 'Task 1',
                },
                {
                  id: 'Task 3',
                  name: 'Testing Phase',
                  start: dayjs().add(15, 'day').format('YYYY-MM-DD'),
                  end: dayjs().add(21, 'day').format('YYYY-MM-DD'),
                  progress: 0,
                  dependencies: 'Task 2',
                },
              ],
            },
            textColor: '#000000',
            backgroundColor: '#ffffff',
            fontSize: 16,
          };
        }
      } else if (type === 'text') {
        newItem = {
          i: Date.now().toString(),
          x: 0,
          y: Infinity,
          w: 2,
          h: 1,
          type: 'text',
          content: 'Editable Text',
          data: {},
          textColor: '#000000',
          backgroundColor: '#ffffff',
          fontSize: 16,
        };
      } else if (type === 'existingChart') {
        // Existing Chart handling can be implemented here
        message.info('Feature to add existing charts is not implemented yet.');
        return;
      } else {
        // Handle other types if any
        return;
      }

      // Add the new item if it's not already added via modal callbacks
      if (
        !useExcelData &&
        type !== 'gantt' &&
        type !== 'chart'
      ) {
        setDashboardItems((prevItems: DashboardItem[]) => [...prevItems, newItem]);
        message.success(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`);
      }
    },
    [
      chartName,
      chartSheetName,
      getChartImage,
      readDataFromExcelForRange,
      showChartInputModal,
      showChartTypeSelectionModal,
      openRangeSelectionDialog,
      getRandomColor,
    ]
  );

  // Function to Handle Editing a Dashboard Item
  const handleEditItem = useCallback((item: DashboardItem) => {
    setEditItem({ ...item });
    setEditModalVisible(true);
  }, []);

  // Function to Handle Deleting a Dashboard Item
  const handleDeleteItem = useCallback((itemId: string) => {
    setDashboardItems((prevItems: DashboardItem[]) =>
      prevItems.filter((item: DashboardItem) => item.i !== itemId)
    );
    message.success('Item deleted successfully!');
  }, []);

  // Function to Handle Saving Edited Dashboard Item
  const handleSaveEdit = useCallback(() => {
    if (editItem) {
      setDashboardItems((prevItems: DashboardItem[]) =>
        prevItems.map((item: DashboardItem) => (item.i === editItem.i ? editItem : item))
      );
      message.success('Item updated successfully!');
    }
    setEditModalVisible(false);
    setEditItem(null);
  }, [editItem]);

  // Function to Handle Layout Changes in Grid
  const handleLayoutChange = useCallback((newLayout: any[]) => {
    setDashboardItems((prevItems: DashboardItem[]) =>
      prevItems.map((item: DashboardItem) => {
        const layoutItem = newLayout.find((l) => l.i === item.i);
        return layoutItem
          ? {
              ...item,
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: typeof item.h === 'number' && !isNaN(item.h) ? item.h : 2,
            }
          : item;
      })
    );
  }, []);

  // Function to Add a New Dataset to a Chart
  const handleAddDataset = useCallback(() => {
    if (editItem && editItem.type === 'chart') {
      const newDataset: DatasetItem = {
        label: `New Data ${editItem.data.datasets.length + 1}`,
        data: [10, 20, 30],
        backgroundColor: getRandomColor(0.4),
        borderColor: getRandomColor(1),
      };
      setEditItem({
        ...editItem,
        data: {
          ...editItem.data,
          datasets: [...editItem.data.datasets, newDataset],
        },
      });
      message.success('Dataset added successfully!');
    }
  }, [editItem]);

  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route
            path="/login"
            element={!user && !token ? <Login /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/register"
            element={!user && !token ? <Register /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardList />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/:id"
            element={
              <PrivateRoute>
                <DashboardWrapper />
              </PrivateRoute>
            }
          />
          {/* Redirect unknown routes to Dashboard */}
          <Route path="*" element={<Navigate to={user && token ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </Router>
      <div style={{ padding: '20px' }}>
        {/* Toggle Button for Drawer */}
        <Button
          type="primary"
          icon={<MenuOutlined />}
          onClick={() => setDrawerVisible(true)}
          style={{ marginBottom: '16px' }}
          aria-label="Open Menu"
        >
          Menu
        </Button>

        {/* Drawer Component */}
        <Drawer
          title="Actions"
          placement="left"
          closable={true}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
        >
          <Collapse accordion>
            {/* New Visual Group */}
            <Panel header="New Visual" key="1">
              <Button
                type="primary"
                onClick={() => handleAddItem('text')}
                style={{ marginBottom: '16px', width: '100%' }}
              >
                Add Text Box
              </Button>
              <Tooltip title="Select a range in Excel before clicking to add a chart">
                <Button
                  type="primary"
                  onClick={() => handleAddItem('chart', true)}
                  style={{ marginBottom: '16px', width: '100%' }}
                >
                  Add Chart from Excel Data
                </Button>
              </Tooltip>
              <Button
                type="primary"
                onClick={() => handleAddItem('gantt', true)}
                style={{ width: '100%' }}
              >
                Add Gantt from Excel Data
              </Button>
            </Panel>

            {/* Save and Load Group */}
            <Panel header="Save and Load" key="2">
              <Button
                type="primary"
                onClick={() => handleAddItem('existingChart')}
                style={{ marginBottom: '16px', width: '100%' }}
              >
                Add Existing Excel Chart
              </Button>
              <Button
                type="primary"
                onClick={exportDashboard}
                style={{ marginBottom: '16px', width: '100%' }}
              >
                Save Dashboard
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setSharedDashboardId('');
                  setSharingModalVisible(true);
                }}
                style={{ width: '100%' }}
              >
                Load Shared Dashboard
              </Button>
            </Panel>

            {/* Other Group */}
            <Panel header="Other" key="3">
              <input
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                id="import-dashboard"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    importDashboard(file);
                  }
                }}
              />
              <label htmlFor="import-dashboard">
                <Button type="primary" style={{ marginBottom: '16px', width: '100%' }}>
                  Import Dashboard
                </Button>
              </label>
              <Button
                type="primary"
                onClick={exportDashboard}
                style={{ marginBottom: '16px', width: '100%' }}
              >
                Export Dashboard
              </Button>
              <Button
                type="primary"
                onClick={() => setEmailModalVisible(true)}
                style={{ width: '100%' }}
              >
                Subscribe to Weekly Emails
              </Button>
            </Panel>
          </Collapse>
        </Drawer>

        {/* Sharing Modal */}
        <Modal
          title={sharedDashboardId ? 'Dashboard Saved' : 'Load Shared Dashboard'}
          open={sharingModalVisible}
          onOk={handleModalOk}
          onCancel={() => setSharingModalVisible(false)}
          okText={sharedDashboardId ? 'OK' : 'Load'}
        >
          {sharedDashboardId ? (
            <>
              <p>Your Dashboard ID:</p>
              <Input value={sharedDashboardId} readOnly />
              <p>Share this ID with others to allow them to load your dashboard.</p>
            </>
          ) : (
            <>
              <p>Enter Dashboard ID to Load:</p>
              <Input
                placeholder="Enter Dashboard ID"
                value={dashboardIdInput}
                onChange={(e) => setDashboardIdInput(e.target.value)}
              />
            </>
          )}
        </Modal>

        {/* Email Subscription Modal */}
        <Modal
          title="Subscribe to Weekly Dashboard Emails"
          open={emailModalVisible}
          onOk={subscribeToEmails}
          onCancel={() => setEmailModalVisible(false)}
        >
          <Form layout="vertical">
            <Form.Item label="Email">
              <Input
                type="email"
                placeholder="Enter your email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Input Modal for Range and Chart Selection */}
        <Modal
          title={inputModalTitle}
          open={inputModalVisible}
          onOk={async () => {
            setInputModalVisible(false);
            await inputModalCallback();
          }}
          onCancel={() => {
            setInputModalVisible(false);
          }}
        >
          {inputModalType === 'chart' ? (
            <Form layout="vertical">
              <Form.Item label="Worksheet">
                <Select
                  value={chartSheetName}
                  onChange={async (value: string) => {
                    setChartSheetName(value);
                    // Fetch chart names when a worksheet is selected
                    const charts = await getChartNames(value);
                    setChartNames(charts);
                    setChartName(''); // Reset chart name
                  }}
                  placeholder="Select a worksheet"
                >
                  {worksheetNames.map((name) => (
                    <Option key={name} value={name}>
                      {name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Chart">
                <Select
                  value={chartName}
                  onChange={(value: string) => setChartName(value)}
                  placeholder="Select a chart"
                  disabled={!chartNames.length}
                >
                  {chartNames.map((name) => (
                    <Option key={name} value={name}>
                      {name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          ) : (
            <Form layout="vertical">
              <Form.Item label="Input">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g., A1:D5"
                />
              </Form.Item>
            </Form>
          )}
        </Modal>

        {/* Chart Type Selection Modal */}
        <Modal
          title="Select Chart Type"
          open={chartTypeModalVisible}
          onOk={() => {
            setChartTypeModalVisible(false);
            chartTypeCallback(selectedChartType);
          }}
          onCancel={() => setChartTypeModalVisible(false)}
        >
          <Form layout="vertical">
            <Form.Item label="Chart Type">
              <Select
                value={selectedChartType}
                onChange={(value: string) => setSelectedChartType(value as DashboardType)}
              >
                <Option value="line">Line</Option>
                <Option value="bar">Bar</Option>
                <Option value="pie">Pie</Option>
                <Option value="doughnut">Doughnut</Option>
                <Option value="radar">Radar</Option>
                <Option value="polarArea">Polar Area</Option>
                <Option value="bubble">Bubble</Option>
                <Option value="scatter">Scatter</Option>
                {/* Add more chart types as needed */}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* GridLayout and Dashboard Items */}
        <GridLayout
          className="layout"
          layout={dashboardItems.map((item) => ({
            i: item.i,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          }))}
          cols={12}
          rowHeight={30}
          width={1200}
          isResizable={true}
          isDraggable={true}
          onLayoutChange={handleLayoutChange}
          resizeHandles={['se', 'sw', 'ne', 'nw']}
          compactType={null}
          preventCollision={false}
        >
          {dashboardItems.map((item) => (
            <div
              key={item.i}
              data-grid={{
                i: item.i,
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h,
                minW: 2,
                minH: item.type === 'text' ? 3 : 2,
              }}
              onMouseEnter={() => setHoveredItemId(item.i)}
              onMouseLeave={() => setHoveredItemId(null)}
              style={{ position: 'relative' }}
            >
              <div
                style={{
                  border: '1px solid #ccc',
                  padding: '10px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  backgroundColor: item.backgroundColor,
                  color: item.textColor,
                  fontSize: item.fontSize,
                }}
              >
                {item.type === 'text' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    style={{ flexGrow: 1, minHeight: '100px', overflow: 'visible' }}
                    onBlur={(e) => {
                      const sanitizedContent = e.currentTarget.innerText
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                      setDashboardItems((prevItems) =>
                        prevItems.map((i) =>
                          i.i === item.i ? { ...i, content: sanitizedContent } : i
                        )
                      );
                    }}
                  >
                    {item.content}
                  </div>
                ) : isGanttDashboardItem(item) ? (
                  <div style={{ flexGrow: 1 }}>
                    <FrappeGantt
                      tasks={item.data.tasks}
                      viewMode="Week"
                      onDateChange={(task: Task) => {
                        setDashboardItems((prevItems) =>
                          prevItems.map((i) => {
                            if (i.i === item.i && isGanttDashboardItem(i)) {
                              const updatedTasks = i.data.tasks.map((t: Task) =>
                                t.id === task.id ? task : t
                              );
                              return {
                                ...i,
                                data: {
                                  ...i.data,
                                  tasks: updatedTasks,
                                },
                              };
                            }
                            return i;
                          })
                        );
                      }}
                    />
                  </div>
                ) : isExistingChartDashboardItem(item) ? (
                  <div style={{ flexGrow: 1 }}>
                    <img
                      src={`data:image/png;base64,${item.data.imageData}`}
                      alt="Existing Chart"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : isChartDashboardItem(item) ? (
                  <div style={{ flexGrow: 1 }}>
                    <ChartComponents
                      type={item.data.type}
                      data={{
                        labels: item.data.labels,
                        datasets: item.data.datasets,
                      }}
                      title={item.data.title}
                    />
                  </div>
                ) : null}
                {hoveredItemId === item.i && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      display: 'flex',
                      gap: '4px',
                    }}
                  >
                    <Button size="small" onClick={() => handleEditItem(item)}>
                      Edit
                    </Button>
                    <Button size="small" danger onClick={() => handleDeleteItem(item.i)}>
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </GridLayout>

        {/* Edit Modal */}
        <Modal
          title="Edit Item"
          open={editModalVisible}
          onOk={handleSaveEdit}
          onCancel={() => {
            setEditModalVisible(false);
            setEditItem(null);
          }}
          width={800}
        >
          {editItem && editItem.type === 'text' && (
            <Form layout="vertical">
              <Form.Item label="Text Content">
                <ReactQuill
                  value={editItem.content}
                  onChange={(value) =>
                    setEditItem({
                      ...editItem,
                      content: value,
                    })
                  }
                  placeholder="Enter text here..."
                />
              </Form.Item>
              <Form.Item label="Text Color">
                <Input
                  type="color"
                  value={editItem.textColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditItem({
                      ...editItem,
                      textColor: e.target.value,
                    })
                  }
                />
              </Form.Item>
              <Form.Item label="Background Color">
                <Input
                  type="color"
                  value={editItem.backgroundColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditItem({
                      ...editItem,
                      backgroundColor: e.target.value,
                    })
                  }
                />
              </Form.Item>
              <Form.Item label="Font Size (px)">
                <Input
                  type="number"
                  min={8}
                  max={48}
                  value={editItem.fontSize}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      fontSize: parseInt(e.target.value, 10),
                    })
                  }
                />
              </Form.Item>
            </Form>
          )}
          {editItem && editItem.type === 'chart' && (
            <Form layout="vertical">
              <Form.Item label="Chart Title">
                <Input
                  value={editItem.data.title}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, title: e.target.value },
                    })
                  }
                  placeholder="Enter chart title..."
                />
              </Form.Item>
              <Form.Item label="Show Legend">
                <Switch
                  checked={editItem.data.showLegend}
                  onChange={(checked) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, showLegend: checked },
                    })
                  }
                />
              </Form.Item>
              <Form.Item label="Chart Type">
                <Select
                  value={editItem.data.type}
                  onChange={(value: string) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, type: value as DashboardType },
                    })
                  }
                >
                  <Option value="line">Line</Option>
                  <Option value="bar">Bar</Option>
                  <Option value="pie">Pie</Option>
                  <Option value="doughnut">Doughnut</Option>
                  <Option value="radar">Radar</Option>
                  <Option value="polarArea">Polar Area</Option>
                  <Option value="bubble">Bubble</Option>
                  <Option value="scatter">Scatter</Option>
                  {/* Add more chart types as needed */}
                </Select>
              </Form.Item>
              <Form.Item label="Labels (comma-separated)">
                <Input
                  value={editItem.data.labels.join(', ')}
                  onChange={(e) => {
                    const labels = e.target.value.split(',').map((label) => label.trim());
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, labels },
                    });
                  }}
                  placeholder="e.g., January, February, March"
                />
              </Form.Item>
              {editItem.data.datasets.map((dataset, index) => (
                <div key={index} style={{ marginBottom: '16px' }}>
                  <Form.Item label={`Dataset Label ${index + 1}`}>
                    <Input
                      value={dataset.label}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditItem({
                          ...editItem,
                          data: {
                            ...editItem.data,
                            datasets: editItem.data.datasets.map((ds, dsIndex) =>
                              dsIndex === index ? { ...ds, label: e.target.value } : ds
                            ),
                          },
                        })
                      }
                      placeholder="Enter dataset label..."
                    />
                  </Form.Item>
                  <Form.Item label={`Data Values (comma-separated) ${index + 1}`}>
                    <Input
                      value={dataset.data.join(', ')}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const data = e.target.value
                          .split(',')
                          .map((value) => parseFloat(value.trim()) || 0);
                        setEditItem({
                          ...editItem,
                          data: {
                            ...editItem.data,
                            datasets: editItem.data.datasets.map((ds, dsIndex) =>
                              dsIndex === index ? { ...ds, data } : ds
                            ),
                          },
                        });
                      }}
                      placeholder="e.g., 10, 20, 30"
                    />
                  </Form.Item>
                  <Form.Item label={`Dataset Background Color ${index + 1}`}>
                    <Input
                      type="color"
                      value={dataset.backgroundColor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditItem({
                          ...editItem,
                          data: {
                            ...editItem.data,
                            datasets: editItem.data.datasets.map((ds, dsIndex) =>
                              dsIndex === index ? { ...ds, backgroundColor: e.target.value } : ds
                            ),
                          },
                        })
                      }
                    />
                  </Form.Item>
                  <Form.Item label={`Dataset Border Color ${index + 1}`}>
                    <Input
                      type="color"
                      value={dataset.borderColor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditItem({
                          ...editItem,
                          data: {
                            ...editItem.data,
                            datasets: editItem.data.datasets.map((ds, dsIndex) =>
                              dsIndex === index ? { ...ds, borderColor: e.target.value } : ds
                            ),
                          },
                        })
                      }
                    />
                  </Form.Item>
                </div>
              ))}
              <Button onClick={handleAddDataset} style={{ marginTop: '10px' }}>
                Add Dataset
              </Button>
            </Form>
          )}
          {editItem && editItem.type === 'gantt' && (
            <Form layout="vertical">
              <Form.Item label="Gantt Tasks">
                {editItem.data.tasks.map((task, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '16px',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  >
                    <Form.Item label="Task Name">
                      <Input
                        value={task.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const tasks = [...editItem.data.tasks];
                          tasks[index].name = e.target.value;
                          setEditItem({
                            ...editItem,
                            data: { ...editItem.data, tasks },
                          });
                        }}
                        placeholder="Enter task name..."
                      />
                    </Form.Item>
                    <Form.Item label="Start Date">
                      <DatePicker
                        value={task.start ? dayjs(task.start) : null}
                        onChange={(date: dayjs.Dayjs | null) => {
                          const tasks = [...editItem.data.tasks];
                          tasks[index].start = date ? date.format('YYYY-MM-DD') : '';
                          setEditItem({
                            ...editItem,
                            data: { ...editItem.data, tasks },
                          });
                        }}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="End Date">
                      <DatePicker
                        value={task.end ? dayjs(task.end) : null}
                        onChange={(date: dayjs.Dayjs | null) => {
                          const tasks = [...editItem.data.tasks];
                          tasks[index].end = date ? date.format('YYYY-MM-DD') : '';
                          setEditItem({
                            ...editItem,
                            data: { ...editItem.data, tasks },
                          });
                        }}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="Progress (%)">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={task.progress}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const progress = parseInt(e.target.value, 10);
                          const tasks = [...editItem.data.tasks];
                          tasks[index].progress = isNaN(progress) ? 0 : progress;
                          setEditItem({
                            ...editItem,
                            data: { ...editItem.data, tasks },
                          });
                        }}
                        placeholder="Enter progress..."
                      />
                    </Form.Item>
                    <Form.Item label="Dependencies (comma-separated IDs)">
                      <Input
                        value={task.dependencies || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const dependencies = e.target.value
                            .split(',')
                            .map((dep) => dep.trim())
                            .filter((dep) => dep !== '');
                          const tasks = [...editItem.data.tasks];
                          tasks[index].dependencies = dependencies.join(',');
                          setEditItem({
                            ...editItem,
                            data: { ...editItem.data, tasks },
                          });
                        }}
                        placeholder="e.g., Task 1, Task 2"
                      />
                    </Form.Item>
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => {
                    const newTaskId = `Task ${editItem.data.tasks.length + 1}`;
                    const newTask: Task = {
                      id: newTaskId,
                      name: `New Task ${editItem.data.tasks.length + 1}`,
                      start: dayjs().format('YYYY-MM-DD'),
                      end: dayjs().add(7, 'day').format('YYYY-MM-DD'),
                      progress: 0,
                      dependencies: '',
                    };
                    setEditItem({
                      ...editItem,
                      data: {
                        ...editItem.data,
                        tasks: [...editItem.data.tasks, newTask],
                      },
                    });
                    message.success('New task added!');
                  }}
                >
                  Add Task
                </Button>
              </Form.Item>
            </Form>
          )}
        </Modal>
      </div>
    </AuthProvider>
  );
};

// DashboardWrapper Component to handle route params
const DashboardWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Dashboard dashboardId={id} />;
};

// Export the App Component as default
export default App;
