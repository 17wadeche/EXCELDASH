/// <reference types="office-js" />
// src/taskpane/components/EditWidgetForm.tsx

import React, { useEffect, useState, useContext } from 'react';
import { Form, Input, Button, InputNumber, message, Select, Switch, Collapse, DatePicker } from 'antd';
import { MinusCircleOutlined, PlusOutlined, SelectOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { DashboardContext } from '../context/DashboardContext';
import { Widget, TextData, ChartData, GanttWidgetData, MetricData, TitleWidgetData } from './types';

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

interface EditWidgetFormProps {
  widget: Widget;
  onSubmit: (
    updatedData: TextData | ChartData | GanttWidgetData | MetricData | TitleWidgetData
  ) => void;
  onCancel: () => void;
  isPresenterMode?: boolean;
}

const EditWidgetForm: React.FC<EditWidgetFormProps> = ({
  widget,
  onSubmit,
  onCancel,
  isPresenterMode,
}) => {
  const [form] = Form.useForm();
  const widgetId = widget.id;
  const { availableWorksheets } = useContext(DashboardContext)!;
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedRange, setSelectedRange] = useState<string>('');
  const initialChartType =
    widget.type === 'chart'
      ? (widget.data as ChartData).type
      : 'bar';
  const [chartType, setChartType] = useState(initialChartType);

  useEffect(() => {
    setSheets(availableWorksheets);
  }, [availableWorksheets]);

  const initialValues = () => {
    switch (widget.type) {
      case 'text':
        return widget.data as TextData;
      case 'chart':
        const chartData = widget.data as ChartData;
        return {
          title: chartData.title || 'Chart',
          chartType:
            chartData.type === 'line' && chartData.datasets.some(ds => ds.fill)
              ? 'area'
              : chartData.type,
          showDataLabels: false,
          labels: chartData.labels.join(', '),
          worksheetName:
            (widget.data as ChartData).worksheetName || sheets[0] || '',
          associatedRange:
            (widget.data as ChartData).associatedRange || '',
          datasets: chartData.datasets.map((dataset) => ({
            label: dataset.label,
            data: Array.isArray(dataset.data)
              ? dataset.data.join(', ')
              : dataset.data,
            type: dataset.type || 'bar',
            backgroundColor: dataset.backgroundColor,
            borderColor: dataset.borderColor,
            borderWidth: dataset.borderWidth,
          })),
          titleAlignment: chartData.titleAlignment || 'left',
          xAxisType: chartData.scales?.x?.type || 'category',
          xAxisTitle: chartData.scales?.x?.title?.text || '',
          yAxisType: chartData.scales?.y?.type || 'linear',
          yAxisTitle: chartData.scales?.y?.title?.text || '',
          enableZoom:
            chartData.plugins?.zoom?.zoom?.wheel?.enabled || false,
          enablePan:
            chartData.plugins?.zoom?.pan?.enabled || false,
          zoomMode: chartData.plugins?.zoom?.zoom?.mode || 'xy',
          dataLabelColor:
            chartData.plugins?.datalabels?.color || '#36A2EB',
          dataLabelFontSize:
            chartData.plugins?.datalabels?.font?.size || 12,
          showLegend:
            chartData.plugins?.legend?.display !== false,
          legendPosition:
            chartData.plugins?.legend?.position || 'bottom',
          annotations:
            chartData.plugins?.annotation?.annotations || [],
          enableTooltips:
            chartData.plugins?.tooltip?.enabled !== false,
          tooltipTemplate: '',
          chartBackgroundColor:
            chartData.backgroundColor || '#ffffff',
          gridLineColor:
            chartData.gridLineColor || 'rgba(0, 0, 0, 0.1)',
          locale: chartData.locale || 'en-US',
          enableDynamicUpdates:
            chartData.dynamicUpdate?.enabled || false,
          updateInterval:
            chartData.dynamicUpdate?.interval || 5,
          useGradientFills:
            chartData.gradientFills?.enabled || false,
          gradientStartColor:
            chartData.gradientFills?.startColor ||
            'rgba(75,192,192,0)',
          gradientEndColor:
            chartData.gradientFills?.endColor ||
            'rgba(75,192,192,0.4)',
        };
      case 'gantt':
        const ganttData = widget.data as GanttWidgetData;
        return {
          ganttTitle: ganttData.ganttTitle || 'Gantt Chart',
          tasks: ganttData.tasks.map((task) => ({
            ...task,
            start: moment(task.start),
            end: moment(task.end),
            dependencies: task.dependencies
              ? task.dependencies.toString()
              : '',
          })),
          titleAlignment: widget.data.titleAlignment || 'left',
        };
      case 'metric':
        return {
          ...widget.data,
          titleAlignment: widget.data.titleAlignment || 'left',
          worksheetName:
            (widget.data as MetricData).worksheetName || sheets[0] || '',
          cellAddress: (widget.data as MetricData).cellAddress || '',
        } as MetricData;

      case 'title':
        return widget.data as TitleWidgetData;
      default:
        return {};
    }
  };

  useEffect(() => {
    form.setFieldsValue(initialValues());
  }, [widget]);

  const handleFinish = (values: any) => {
    const cleanedValues: Record<string, any> = Object.entries(values).reduce(
      (acc: Record<string, any>, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    let updatedData: any;
    switch (widget.type) {
      case 'text':
        updatedData = cleanedValues;
        break;
      case 'title':
        updatedData = cleanedValues as TitleWidgetData;
        break;
      case 'chart':
        updatedData = {
          title: cleanedValues.title,
          type:
            cleanedValues.chartType === 'area'
              ? 'line'
              : cleanedValues.chartType,
          worksheetName: cleanedValues.worksheetName,
          associatedRange: cleanedValues.associatedRange,
          labels: cleanedValues.labels
            .split(',')
            .map((label: string) => label.trim()),
          datasets: cleanedValues.datasets.map((dataset: any) => ({
            label: dataset.label,
            data:
              typeof dataset.data === 'string'
                ? dataset.data
                    .split(',')
                    .map((num: string) => Number(num.trim()))
                : Array.isArray(dataset.data)
                ? dataset.data.map((num: any) => Number(num))
                : [Number(dataset.data)],
            type: dataset.type || undefined, // Include dataset type for mixed charts
            fill:
              cleanedValues.chartType === 'area' ||
              dataset.type === 'area'
                ? true
                : false, // Handle area charts
            backgroundColor: dataset.backgroundColor || '#4caf50',
            borderColor: dataset.borderColor || '#4caf50',
            borderWidth: dataset.borderWidth || 1,
          })),
          titleAlignment: cleanedValues.titleAlignment || 'left',
          scales: {
            x: {
              type: cleanedValues.xAxisType || 'category',
              title: {
                display: !!cleanedValues.xAxisTitle,
                text: cleanedValues.xAxisTitle || '',
              },
            },
            y: {
              type: cleanedValues.yAxisType || 'linear',
              title: {
                display: !!cleanedValues.yAxisTitle,
                text: cleanedValues.yAxisTitle || '',
              },
            },
          },
          plugins: {
            legend: {
              display: cleanedValues.showLegend !== false,
              position: cleanedValues.legendPosition || 'top',
            },
            annotation: {
              annotations: cleanedValues.annotations || [],
            },
            datalabels: {
              display: cleanedValues.showDataLabels !== false,
              color: cleanedValues.dataLabelColor || '#000',
              font: {
                size: cleanedValues.dataLabelFontSize || 12,
              },
            },
            zoom: {
              pan: {
                enabled: cleanedValues.enablePan || false,
                mode: 'xy',
              },
              zoom: {
                wheel: {
                  enabled: cleanedValues.enableZoom || false,
                },
                pinch: {
                  enabled: cleanedValues.enableZoom || false,
                },
                mode: cleanedValues.zoomMode || 'xy',
              },
            },
            tooltip: {
              enabled: cleanedValues.enableTooltips !== false,
              callbacks: {
                label: function (context: any) {
                  const label = context.dataset.label || '';
                  const value = context.formattedValue;
                  return cleanedValues.tooltipTemplate
                    ? cleanedValues.tooltipTemplate
                        .replace('{label}', label)
                        .replace('{value}', value)
                    : `${label}: ${value}`;
                },
              },
            },
          },
          backgroundColor: cleanedValues.chartBackgroundColor || '#ffffff',
          gridLineColor:
            cleanedValues.gridLineColor || 'rgba(0, 0, 0, 0.1)',
          locale: cleanedValues.locale || 'en-US',
          dynamicUpdate: {
            enabled: cleanedValues.enableDynamicUpdates || false,
            interval: cleanedValues.updateInterval || 5,
          },
          gradientFills: {
            enabled: cleanedValues.useGradientFills || false,
            startColor:
              cleanedValues.gradientStartColor ||
              'rgba(75,192,192,0)',
            endColor:
              cleanedValues.gradientEndColor ||
              'rgba(75,192,192,0.4)',
          },
        } as ChartData;
        break;
      case 'gantt':
        updatedData = {
          tasks: cleanedValues.tasks.map((task: any) => ({
            id: task.id,
            name: task.name,
            start: task.start.format('YYYY-MM-DD'),
            end: task.end.format('YYYY-MM-DD'),
            progress: task.progress,
            dependencies: task.dependencies
              ? task.dependencies
                  .split(',')
                  .map((dep: string) => dep.trim())
                  .join(',')
              : '',
            color: task.color,
          })),
          title: cleanedValues.title,
          titleAlignment: cleanedValues.titleAlignment || 'left',
        } as GanttWidgetData;
        break;
      case 'metric':
        updatedData = {
          ...cleanedValues,
          displayName: cleanedValues.displayName || 'Metric',
          titleAlignment: cleanedValues.titleAlignment || 'left',
          worksheetName: cleanedValues.worksheetName, // Correct source
          cellAddress: cleanedValues.cellAddress, // Correct source
        };
        break;
      default:
        updatedData = {};
    }
    console.log('Updated Data:', updatedData);
    onSubmit(updatedData);
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <Form
      form={form}
      initialValues={initialValues()}
      onFinish={handleFinish}
      layout="vertical"
    >
      {widget.type === 'text' && (
        <>
          <Form.Item
            name="content"
            label="Content"
            rules={[
              { required: true, message: 'Please enter content' },
            ]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="fontSize" label="Font Size">
            <InputNumber min={12} max={72} />
          </Form.Item>
          <Form.Item name="textColor" label="Text Color">
            <Input type="color" />
          </Form.Item>
          <Form.Item name="backgroundColor" label="Background Color">
            <Input type="color" />
          </Form.Item>
          <Form.Item name="titleAlignment" label="Title Alignment">
            <Select>
              <Option value="left">Left</Option>
              <Option value="center">Center</Option>
            </Select>
          </Form.Item>
        </>
      )}
      {widget.type === 'title' && (
        <>
          <Form.Item
            name="content"
            label="Title Text"
            rules={[{ required: true, message: 'Please enter the title text' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="fontSize" label="Font Size">
            <InputNumber min={12} max={72} />
          </Form.Item>
          <Form.Item name="textColor" label="Text Color">
            <Input type="color" />
          </Form.Item>
          <Form.Item name="backgroundColor" label="Background Color">
            <Input type="color" />
          </Form.Item>
          <Form.Item name="titleAlignment" label="Title Alignment">
            <Select>
              <Option value="left">Left</Option>
              <Option value="center">Center</Option>
              <Option value="right">Right</Option>
            </Select>
          </Form.Item>
        </>
      )}
      {widget.type === 'chart' && (
        <>
          <Form.Item
            name="title"
            label="Chart Title"
            rules={[
              { required: true, message: 'Please enter chart title' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="chartType"
            label="Chart Type"
            rules={[
              { required: true, message: 'Please select chart type' },
            ]}
          >
            <Select onChange={(value) => setChartType(value)}>
              <Option value="line">Bar</Option>
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
            name="labels"
            label="Labels (comma-separated)"
            rules={[
              { required: true, message: 'Please enter labels' },
            ]}
          >
            <Input />
          </Form.Item>
          {/* Worksheet Selection */}
          <Form.Item
            name="worksheetName"
            label="Worksheet"
            rules={[
              { required: true, message: 'Please select a worksheet' },
            ]}
          >
            <Select placeholder="Select worksheet">
              {availableWorksheets.map(sheet => (
                <Option key={sheet} value={sheet}>
                  {sheet}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {/* Data Range Input */}
          <Form.Item
            name="associatedRange"
            label="Data Range"
            rules={[
              { required: true, message: 'Please enter a data range' },
              {
                pattern: /^[A-Za-z]{1,3}[1-9][0-9]{0,6}:[A-Za-z]{1,3}[1-9][0-9]{0,6}$/,
                message: 'Please enter a valid range (e.g., A1:B10)',
              },
            ]}
          >
            <Input placeholder="e.g., A1:B10" />
          </Form.Item>
          {/* Select Data Range from Excel Button */}
          {!isPresenterMode && (
            <Form.Item>
              <Button
                type="primary"
                icon={<SelectOutlined />}
                onClick={async () => {
                  if (isPresenterMode) {
                    message.warning('Loading data from Excel is not available in full-screen mode.');
                    return;
                    }
                  try {
                    await Excel.run(async (context) => {
                      const range = context.workbook.getSelectedRange();
                      range.load(['address', 'worksheet']);
                      await context.sync();
                      const worksheetName = range.worksheet.name;
                      const associatedRange = range.address.replace(/^.*!/, '');
                      form.setFieldsValue({
                        worksheetName,
                        associatedRange,
                      });
                      const worksheet = context.workbook.worksheets.getItem(worksheetName);
                      const dataRange = worksheet.getRange(associatedRange);
                      dataRange.load('values');
                      await context.sync();
                      const data = dataRange.values;
                      console.log('Data from Excel:', data);
                      const labels = data[0].slice(1);
                      const datasets = data.slice(1).map((row) => ({
                        label: row[0],
                        data: row.slice(1).join(', '),
                        type: 'bar',
                        backgroundColor: getRandomColor(),
                        borderColor: getRandomColor(),
                        borderWidth: 1,
                      }));
                      form.setFieldsValue({
                        labels: labels.join(', '),
                        datasets,
                      });
                      message.success('Data loaded successfully from Excel.');
                    });
                  } catch (error) {
                    console.error('Error loading data from Excel:', error);
                    message.error('Failed to load data from Excel.');
                  }
                }}
              >
                Select and Load Data from Excel
              </Button>
            </Form.Item>
          )}
          {/* Datasets Configuration */}
          <Form.List name="datasets">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{
                      marginBottom: 16,
                      borderBottom: '1px solid #eee',
                      paddingBottom: 16,
                    }}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'label']}
                      label="Dataset Label"
                      rules={[
                        {
                          required: true,
                          message: 'Please enter dataset label',
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'type']}
                      label="Dataset Chart Type"
                      rules={[
                        {
                          required: true,
                          message:
                            'Please select chart type for this dataset',
                        },
                      ]}
                      initialValue="line"
                    >
                      <Select>
                        <Option value="line">Bar</Option>
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
                      {...restField}
                      name={[name, 'data']}
                      label="Data Points (comma-separated)"
                      rules={[
                        {
                          required: true,
                          message: 'Please enter data points',
                        },
                        {
                          validator: (_, value) => {
                            if (!value) return Promise.resolve();
                            const isValid = value
                              .split(',')
                              .every((v: string) => !isNaN(parseFloat(v.trim())));
                            return isValid
                              ? Promise.resolve()
                              : Promise.reject(
                                  'Data points must be comma-separated numbers'
                                );
                          },
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'backgroundColor']}
                      label="Background Color"
                      rules={[
                        {
                          required: true,
                          message: 'Please select background color',
                        },
                      ]}
                    >
                      <Input type="color" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'borderColor']}
                      label="Border Color"
                      rules={[
                        {
                          required: true,
                          message: 'Please select border color',
                        },
                      ]}
                    >
                      <Input type="color" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'borderWidth']}
                      label="Border Width"
                      rules={[
                        {
                          required: true,
                          message: 'Please enter border width',
                        },
                      ]}
                    >
                      <InputNumber min={0} />
                    </Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => remove(name)}
                      icon={<MinusCircleOutlined />}
                    >
                      Remove Dataset
                    </Button>
                  </div>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() =>
                      add({
                        label: '',
                        type: 'bar',
                        data: '',
                        backgroundColor: '#4caf50',
                        borderColor: '#4caf50',
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
          {/* Collapse Panels for Advanced Settings */}
          <Collapse>
            <Panel header="Axis Settings" key="1">
              <Form.Item label="X-Axis Type" name="xAxisType">
                <Select>
                  <Option value="category">Category</Option>
                  <Option value="linear">Linear</Option>
                  <Option value="logarithmic">Logarithmic</Option>
                </Select>
              </Form.Item>
              <Form.Item label="X-Axis Title" name="xAxisTitle">
                <Input />
              </Form.Item>
              <Form.Item label="Y-Axis Type" name="yAxisType">
                <Select>
                  <Option value="linear">Linear</Option>
                  <Option value="logarithmic">Logarithmic</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Y-Axis Title" name="yAxisTitle">
                <Input />
              </Form.Item>
            </Panel>
            <Panel header="Plugins" key="2">
              <Form.Item
                label="Enable Zoom"
                name="enableZoom"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                label="Enable Pan"
                name="enablePan"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item label="Zoom Mode" name="zoomMode">
                <Select>
                  <Option value="x">X</Option>
                  <Option value="y">Y</Option>
                  <Option value="xy">XY</Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="Show Data Labels"
                name="showDataLabels"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
              <Form.Item label="Data Label Color" name="dataLabelColor">
                <Input type="color" />
              </Form.Item>
              <Form.Item
                label="Data Label Font Size"
                name="dataLabelFontSize"
              >
                <InputNumber min={8} max={24} />
              </Form.Item>
              <Form.Item
                label="Enable Tooltips"
                name="enableTooltips"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                label="Tooltip Template"
                name="tooltipTemplate"
              >
                <TextArea
                  placeholder="Use {label} and {value} placeholders"
                  rows={3}
                />
              </Form.Item>
              <Form.Item label="Annotations">
                <Form.List name="annotations">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <div key={key} style={{ marginBottom: 16 }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'type']}
                            label="Annotation Type"
                            rules={[
                              {
                                required: true,
                                message:
                                  'Please select annotation type',
                              },
                            ]}
                          >
                            <Select>
                              <Option value="line">Line</Option>
                              <Option value="box">Box</Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'value']}
                            label="Value"
                            rules={[
                              {
                                required: true,
                                message: 'Please enter value',
                              },
                            ]}
                          >
                            <InputNumber />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'label']}
                            label="Label"
                          >
                            <Input />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'color']}
                            label="Color"
                            rules={[
                              {
                                required: true,
                                message: 'Please select color',
                              },
                            ]}
                          >
                            <Input type="color" />
                          </Form.Item>
                          <Button
                            type="dashed"
                            onClick={() => remove(name)}
                            icon={<MinusCircleOutlined />}
                          >
                            Remove Annotation
                          </Button>
                        </div>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          icon={<PlusOutlined />}
                        >
                          Add Annotation
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            </Panel>
            <Panel header="Legend" key="3">
              <Form.Item
                label="Show Legend"
                name="showLegend"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item label="Legend Position" name="legendPosition">
                <Select>
                  <Option value="top">Top</Option>
                  <Option value="bottom">Bottom</Option>
                  <Option value="left">Left</Option>
                  <Option value="right">Right</Option>
                </Select>
              </Form.Item>
            </Panel>
            <Panel header="Styling" key="4">
              <Form.Item
                label="Chart Background Color"
                name="chartBackgroundColor"
              >
                <Input type="color" />
              </Form.Item>
              <Form.Item label="Grid Line Color" name="gridLineColor">
                <Input type="color" />
              </Form.Item>
              <Form.Item
                label="Use Gradient Fills"
                name="useGradientFills"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                label="Gradient Start Color"
                name="gradientStartColor"
              >
                <Input type="color" />
              </Form.Item>
              <Form.Item
                label="Gradient End Color"
                name="gradientEndColor"
              >
                <Input type="color" />
              </Form.Item>
            </Panel>
          </Collapse>

          {/* Title Alignment */}
          <Form.Item name="titleAlignment" label="Title Alignment">
            <Select>
              <Option value="left">Left</Option>
              <Option value="center">Center</Option>
            </Select>
          </Form.Item>
        </>
      )}
      {widget.type === 'gantt' && (
        <>
          <Form.Item
            name="title"
            label="Gantt Chart Title"
            rules={[
              { required: true, message: 'Please enter Gantt chart title' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.List name="tasks">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{
                      marginBottom: 16,
                      borderBottom: '1px solid #eee',
                      paddingBottom: 16,
                    }}
                  >
                    {/* Hidden ID Field */}
                    {form.isFieldTouched(['tasks', name, 'id']) ? (
                      <Form.Item
                        {...restField}
                        name={[name, 'id']}
                        hidden
                      >
                        <Input />
                      </Form.Item>
                    ) : (
                      <Form.Item
                        {...restField}
                        name={[name, 'id']}
                        initialValue={uuidv4()}
                        hidden
                      >
                        <Input />
                      </Form.Item>
                    )}
                    {/* Task Name */}
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      label="Task Name"
                      rules={[
                        {
                          required: true,
                          message: 'Please enter task name',
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                    {/* Start Date */}
                    <Form.Item
                      {...restField}
                      name={[name, 'start']}
                      label="Start Date"
                      rules={[
                        {
                          required: true,
                          message: 'Please select start date',
                        },
                      ]}
                    >
                      <DatePicker />
                    </Form.Item>
                    {/* End Date */}
                    <Form.Item
                      {...restField}
                      name={[name, 'end']}
                      label="End Date"
                      rules={[
                        {
                          required: true,
                          message: 'Please select end date',
                        },
                      ]}
                    >
                      <DatePicker />
                    </Form.Item>
                    {/* Progress */}
                    <Form.Item
                      {...restField}
                      name={[name, 'progress']}
                      label="Progress (%)"
                    >
                      <InputNumber min={0} max={100} />
                    </Form.Item>
                    {/* Dependencies */}
                    <Form.Item
                      {...restField}
                      name={[name, 'dependencies']}
                      label="Dependencies (comma-separated IDs)"
                    >
                      <Input />
                    </Form.Item>
                    {/* Task Color */}
                    <Form.Item
                      {...restField}
                      name={[name, 'color']}
                      label="Task Color"
                      rules={[
                        {
                          required: true,
                          message: 'Please select task color',
                        },
                      ]}
                    >
                      <Input type="color" />
                    </Form.Item>
                    {/* Remove Task Button */}
                    <Button
                      type="dashed"
                      onClick={() => remove(name)}
                      icon={<MinusCircleOutlined />}
                    >
                      Remove Task
                    </Button>
                  </div>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add({ id: uuidv4() })}
                    icon={<PlusOutlined />}
                  >
                    Add Task
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          {/* Title Alignment */}
          <Form.Item name="titleAlignment" label="Title Alignment">
            <Select>
              <Option value="left">Left</Option>
              <Option value="center">Center</Option>
            </Select>
          </Form.Item>
        </>
      )}
      {widget.type === 'metric' && (
        <>
          <Form.Item
            name="worksheetName"
            label="Worksheet"
            rules={[
              { required: true, message: 'Please select a worksheet' },
            ]}
          >
            <Select placeholder="Select worksheet">
              {availableWorksheets.map(sheet => (
                <Option key={sheet} value={sheet}>
                  {sheet}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="cellAddress"
            label="Linked Cell"
            rules={[
              {
                required: true,
                message: 'Please select a cell',
              },
              {
                pattern: /^[A-Za-z]{1,3}[1-9][0-9]{0,6}$/,
                message: 'Please enter a valid cell address (e.g., E8)',
              },
            ]}
          >
            <Input placeholder="Enter cell address (e.g., E8)" />
          </Form.Item>
          <Form.Item>
          <Button
            icon={<SelectOutlined />}
            onClick={async () => {
              if (Office.context.ui.messageParent) {
                Office.context.ui.messageParent(
                  JSON.stringify({ type: 'selectCell', widgetId })
                );
              } else {
                try {
                  await Excel.run(async (context) => {
                    const range = context.workbook.getSelectedRange();
                    range.load(['address', 'worksheet']);
                    await context.sync();

                    const selectedWorksheet = range.worksheet;
                    selectedWorksheet.load('name');
                    await context.sync();

                    const sheetName = selectedWorksheet.name;
                    const address = range.address;
                    const cellAddress = address.includes('!')
                      ? address.split('!')[1]
                      : address;

                    form.setFieldsValue({
                      cellAddress: cellAddress,
                      worksheetName: sheetName,
                    });
                  });
                } catch (error) {
                  console.error('Error selecting cell:', error);
                  message.error('Failed to select cell from Excel.');
                }
              }
            }}
          >
            Select Cell from Excel
          </Button>
          </Form.Item>
          {/* Additional fields for Metric Widget */}
          <Form.Item
            name="format"
            label="Display Format"
            rules={[
              { required: true, message: 'Please select a display format' },
            ]}
          >
            <Select placeholder="Select format">
              <Option value="percentage">Percentage (%)</Option>
              <Option value="currency">Currency ($)</Option>
              <Option value="number">Number</Option>
            </Select>
          </Form.Item>
          <Form.Item name="displayName" label="Display Name">
            <Input placeholder="Enter a name to display (optional)" />
          </Form.Item>
          <Form.Item
            name="targetValue"
            label="Target Value"
            rules={[
              { required: true, message: 'Please enter a target value' },
            ]}
          >
            <InputNumber placeholder="Enter target value" />
          </Form.Item>
          <Form.Item
            name="comparison"
            label="Comparison Type"
            rules={[
              { required: true, message: 'Please select a comparison type' },
            ]}
          >
            <Select placeholder="Select comparison type">
              <Option value="greater">
                Greater Than or Equal To
              </Option>
              <Option value="less">Less Than or Equal To</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="fontSize"
            label="Font Size"
            rules={[
              { required: true, message: 'Please enter a font size' },
            ]}
          >
            <InputNumber min={12} max={100} placeholder="Enter font size" />
          </Form.Item>
          <Form.Item name="titleAlignment" label="Title Alignment">
            <Select>
              <Option value="left">Left</Option>
              <Option value="center">Center</Option>
            </Select>
          </Form.Item>
        </>
      )}
      {/* Submit and Cancel Buttons */}
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          style={{ marginRight: '8px' }}
        >
          Save
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </Form.Item>
    </Form>
  );
};

export default EditWidgetForm;
