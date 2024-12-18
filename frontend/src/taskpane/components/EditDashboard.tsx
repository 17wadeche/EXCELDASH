// src/taskpane/components/EditDashboard.tsx

import React, { useEffect, useState, useContext } from 'react';
import { Form, Input, Button, Select, Card, Space, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { DashboardItem, TextData, ChartData, GanttWidgetData, ComponentData, DashboardComponent, Dataset } from './types';
import { DashboardContext } from '../context/DashboardContext';
import TextFormComponent from './TextFormComponent';

const { Option } = Select;
const EditDashboard: React.FC = () => {
  const [form] = Form.useForm();
  const { id } = useParams<{ id: string }>(); // Extract dashboard ID from URL
  const navigate = useNavigate();
  const dashboardContext = useContext(DashboardContext); // Access context
  if (!dashboardContext) {
    throw new Error("DashboardContext must be used within a DashboardProvider");
  }
  const { dashboards, editDashboard } = dashboardContext;
  const [dashboard, setDashboard] = useState<DashboardItem | null>(null);
  useEffect(() => {
    const existingDashboard = dashboards.find((d) => d.id === id);
    if (existingDashboard) {
      setDashboard(existingDashboard);
      form.setFieldsValue(existingDashboard);
    } else {
      message.error('Dashboard not found!');
      navigate('/dashboard-list');
    }
  }, [id, dashboards, form, navigate]);
  const onFinish = (values: any) => {
    const { title, components } = values;
    if (!dashboard) {
      message.error('Dashboard data is missing.');
      return;
    }
    const updatedComponents: DashboardComponent = (components || []).map((comp: any) => {
      let componentData: ComponentData;
      switch (comp.type) {
        case 'gantt':
          componentData = {
            tasks: (comp.data.tasks || []).map((task: any) => ({
              id: task.id || uuidv4(),
              name: task.name,
              start: task.start,
              end: task.end,
              progress: task.progress,
              dependencies: task.dependencies,
              color: task.color,
            })),
          } as GanttWidgetData;
          break;
        case 'chart':
          componentData = {
            title: comp.data.title,
            type: comp.data.chartType,
            labels: comp.data.labels.split(',').map((label: string) => label.trim()),
            datasets: comp.data.datasets.map((dataset: any) => ({
              id: dataset.id || uuidv4(), // Ensure each dataset has an 'id'
              label: dataset.label,
              data: dataset.data.split(',').map((num: string) => Number(num.trim())),
              backgroundColor: dataset.backgroundColor,
              borderColor: dataset.borderColor,
              borderWidth: Number(dataset.borderWidth),
            })),
          } as ChartData;
          break;
        case 'text':
          componentData = {
            content: comp.data.content,
            textColor: comp.data.textColor,
            backgroundColor: comp.data.backgroundColor,
            fontSize: Number(comp.data.fontSize),
          } as TextData;
          break;
        default:
          componentData = {} as ComponentData;
      }
      return {
        id: comp.id || uuidv4(),
        type: comp.type,
        data: componentData,
      };
    });
    const updatedDashboard: DashboardItem = {
      id: dashboard!.id,
      title,
      components: updatedComponents,
      layouts: dashboard.layouts,
      versions: dashboard.versions,
      workbookId: dashboard.workbookId,
    };
    editDashboard(updatedDashboard);
    message.success('Dashboard updated successfully!');
    navigate('/dashboard-list');
  };
  if (!dashboard) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <Form
        form={form}
        name="edit_dashboard"
        onFinish={onFinish}
        layout="vertical"
        autoComplete="off"
        initialValues={{
          components: dashboard.components || [],
        }}
      >
        <Form.Item
          name="title"
          label="Dashboard Title"
          rules={[{ required: true, message: 'Please enter the dashboard title' }]}
        >
          <Input placeholder="Enter dashboard title" />
        </Form.Item>
        <Form.List name="components">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card
                  key={key as React.Key}
                  type="inner"
                  title={`Component ${name + 1}`}
                  style={{ marginBottom: 16 }}
                  extra={<MinusCircleOutlined onClick={() => remove(name)} />}
                >
                  <Form.Item
                    {...restField}
                    name={[name, 'type']}
                    rules={[{ required: true, message: 'Missing component type' }]}
                  >
                    <Select placeholder="Select component type">
                      <Option value="gantt">Gantt</Option>
                      <Option value="chart">Chart</Option>
                      <Option value="text">Text</Option>
                    </Select>
                  </Form.Item>

                {/* Component-Specific Fields */}
                <Form.Item
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.components?.[name]?.type !== currentValues.components?.[name]?.type
                  }
                  noStyle
                >
                  {({ getFieldValue }) => {
                      const type = getFieldValue(['components', name, 'type']);
                      switch (type) {
                        case 'gantt':
                          return (
                            <Form.Item name={[name, 'data']}>
                              <GanttChartFields />
                            </Form.Item>
                          );
                        case 'chart':
                          return (
                            <Form.Item name={[name, 'data']}>
                              <ChartFields />
                            </Form.Item>
                          );
                        case 'text':
                          return (
                            <Form.Item name={[name, 'data']}>
                              <TextFormComponent />
                            </Form.Item>
                          );
                        default:
                          return null;
                      }
                    }}
                  </Form.Item>
                </Card>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ type: 'gantt', data: { tasks: [] } })}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Component
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Update Dashboard
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
const GanttChartFields: React.FC = () => {
  return (
    <>
      <Form.List name={['data', 'tasks']}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, fieldKey, ...restField }) => (
              <Space
                key={key!} // Fixed: Ensure key is not undefined
                align="baseline"
                style={{ display: 'flex', marginBottom: 8 }}
              >
                <Form.Item
                  {...restField}
                  name={[name, 'id']}
                  fieldKey={[fieldKey!, 'id']} // Fixed: Assert fieldKey is not undefined
                  initialValue={uuidv4()}
                  hidden
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'name']}
                  fieldKey={[fieldKey!, 'name']} // Fixed: Assert fieldKey is not undefined
                  rules={[{ required: true, message: 'Missing task name' }]}
                >
                  <Input placeholder="Task Name" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'start']}
                  fieldKey={[fieldKey!, 'start']} // Fixed: Assert fieldKey is not undefined
                  rules={[{ required: true, message: 'Missing start date' }]}
                >
                  <Input placeholder="Start Date (YYYY-MM-DD)" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'end']}
                  fieldKey={[fieldKey!, 'end']} // Fixed: Assert fieldKey is not undefined
                  rules={[{ required: true, message: 'Missing end date' }]}
                >
                  <Input placeholder="End Date (YYYY-MM-DD)" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'progress']}
                  fieldKey={[fieldKey!, 'progress']} // Fixed: Assert fieldKey is not undefined
                  rules={[{ required: true, message: 'Missing progress' }]}
                >
                  <Input placeholder="Progress (0-100)" type="number" min={0} max={100} />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'dependencies']}
                  fieldKey={[fieldKey!, 'dependencies']} // Fixed: Assert fieldKey is not undefined
                >
                  <Input placeholder="Dependencies (comma-separated IDs)" />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() =>
                  add({ id: uuidv4(), name: '', start: '', end: '', progress: 0, dependencies: '' })
                }
                block
                icon={<PlusOutlined />}
              >
                Add Task
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );
};
const ChartFields: React.FC = () => {
  return (
    <>
      <Form.Item
        name={['data', 'title']}
        label="Chart Title"
        rules={[{ required: true, message: 'Please enter chart title' }]}
      >
        <Input placeholder="Enter chart title" />
      </Form.Item>
      <Form.Item
        name={['data', 'chartType']}
        label="Chart Type"
        rules={[{ required: true, message: 'Please select chart type' }]}
      >
        <Select placeholder="Select chart type">
          <Option value="bar">Bar</Option>
          <Option value="line">Line</Option>
          <Option value="pie">Pie</Option>
          <Option value="doughnut">Doughnut</Option>
          <Option value="radar">Radar</Option>
          <Option value="polarArea">Polar Area</Option>
          <Option value="bubble">Bubble</Option>
          <Option value="scatter">Scatter</Option>
        </Select>
      </Form.Item>
      <Form.Item
        name={['data', 'labels']}
        label="Labels (comma-separated)"
        rules={[{ required: true, message: 'Please enter labels' }]}
      >
        <Input placeholder="Enter labels separated by commas" />
      </Form.Item>
      <Form.List name={['data', 'datasets']}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, fieldKey, ...restField }) => (
              <Space
                key={key!} // Fixed: Ensure key is not undefined
                align="baseline"
                style={{ display: 'flex', marginBottom: 8 }}
              >
                <Form.Item
                  {...restField}
                  name={[name, 'id']}
                  fieldKey={[fieldKey!, 'id']} // Fixed: Assert fieldKey is not undefined
                  initialValue={uuidv4()}
                  hidden
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'label']}
                  fieldKey={[fieldKey!, 'label']} // Fixed: Assert fieldKey is not undefined
                  rules={[{ required: true, message: 'Missing dataset label' }]}
                >
                  <Input placeholder="Dataset Label" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'data']}
                  fieldKey={[fieldKey!, 'data']} // Fixed: Assert fieldKey is not undefined
                  rules={[{ required: true, message: 'Missing data points' }]}
                >
                  <Input placeholder="Data Points (comma-separated numbers)" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'backgroundColor']}
                  fieldKey={[fieldKey!, 'backgroundColor']} // Fixed: Assert fieldKey is not undefined
                >
                  <Input placeholder="Background Color" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'borderColor']}
                  fieldKey={[fieldKey!, 'borderColor']} // Fixed: Assert fieldKey is not undefined
                >
                  <Input placeholder="Border Color" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'borderWidth']}
                  fieldKey={[fieldKey!, 'borderWidth']} // Fixed: Assert fieldKey is not undefined
                  rules={[{ required: true, message: 'Missing border width' }]}
                >
                  <Input placeholder="Border Width" type="number" min={0} />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() =>
                  add({
                    id: uuidv4(),
                    label: '',
                    data: '',
                    backgroundColor: '',
                    borderColor: '',
                    borderWidth: 1,
                  })
                }
                block
                icon={<PlusOutlined />}
              >
                Add Dataset
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );
};
const TextFields: React.FC = () => {
  return (
    <>
      <Form.Item
        name={['data', 'content']}
        label="Content"
        rules={[{ required: true, message: 'Please enter content' }]}
      >
        <Input.TextArea placeholder="Enter text content" />
      </Form.Item>
      <Form.Item
        name={['data', 'textColor']}
        label="Text Color"
      >
        <Input placeholder="Enter text color (e.g., #000000)" />
      </Form.Item>
      <Form.Item
        name={['data', 'backgroundColor']}
        label="Background Color"
      >
        <Input placeholder="Enter background color (e.g., #FFFFFF)" />
      </Form.Item>
      <Form.Item
        name={['data', 'fontSize']}
        label="Font Size"
        rules={[{ required: true, message: 'Please enter font size' }]}
      >
        <Input placeholder="Enter font size (e.g., 14)" type="number" min={8} />
      </Form.Item>
    </>
  );
};

export default EditDashboard;
