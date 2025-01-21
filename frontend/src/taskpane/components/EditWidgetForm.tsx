/// <reference types="office-js" />
// src/taskpane/components/EditWidgetForm.tsx

import React, { useEffect, useState, useContext } from 'react';
import { Form, Input, Button, InputNumber, message, Select, Switch, Collapse, DatePicker } from 'antd';
import { MinusCircleOutlined, PlusOutlined, SelectOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { DashboardContext } from '../context/DashboardContext';
import { Widget, TextData, ChartData, GanttWidgetData, MetricData, TitleWidgetData, Task } from './types';

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
          title: ganttData.title || 'Gantt Chart',
          tasks: ganttData.tasks.map((task) => ({
            ...task,
            start: moment(task.start),
            end: moment(task.end),
            dependencies: task.dependencies
              ? task.dependencies.toString()
              : '',
          })),
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
    // Clean out empty strings or undefined
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
      case 'text': {
        updatedData = cleanedValues;
        break;
      }

      case 'title': {
        updatedData = cleanedValues as TitleWidgetData;
        break;
      }

      case 'chart': {
        // If the user typed in a set of slice colors for Pie/Doughnut/PolarArea
        // we parse them here:
        let segmentColorsArray: string[] = [];
        if (
          ['pie', 'doughnut', 'polarArea'].includes(
            cleanedValues.chartType || ''
          ) &&
          cleanedValues.segmentColors
        ) {
          segmentColorsArray = cleanedValues.segmentColors
            .split(',')
            .map((c: string) => c.trim())
            .filter(Boolean);
        }

        // If the user typed in label-specific text colors (for data labels):
        let labelTextColorsArray: string[] = [];
        if (
          ['pie', 'doughnut', 'polarArea'].includes(
            cleanedValues.chartType || ''
          ) &&
          cleanedValues.labelTextColors
        ) {
          labelTextColorsArray = cleanedValues.labelTextColors
            .split(',')
            .map((c: string) => c.trim())
            .filter(Boolean);
        }

        // Build updated chart data:
        updatedData = {
          title: cleanedValues.title,
          type:
            cleanedValues.chartType === 'area'
              ? 'line'
              : cleanedValues.chartType,
          worksheetName: cleanedValues.worksheetName,
          associatedRange: cleanedValues.associatedRange,
          labels: cleanedValues.labels
            ? cleanedValues.labels.split(',').map((label: string) => label.trim())
            : [],
          datasets: (cleanedValues.datasets || []).map((dataset: any) => {
            // Scatter / Bubble: store data as array of points or (x,y,r) objects
            if (dataset.type === 'scatter' || dataset.type === 'bubble') {
              return {
                label: dataset.label,
                data: dataset.data, // user has array-of-objects if loaded from Excel, or a string
                type: dataset.type || undefined,
                fill: false,
                backgroundColor: dataset.backgroundColor || '#4caf50',
                borderColor: dataset.borderColor || '#4caf50',
                borderWidth: dataset.borderWidth || 1,
              };
            } else {
              // Bar / Line / Pie / Doughnut / etc.
              const parsedData =
                typeof dataset.data === 'string'
                  ? dataset.data
                      .split(',')
                      .map((num: string) => Number(num.trim()))
                  : Array.isArray(dataset.data)
                  ? dataset.data.map((num: any) => Number(num))
                  : [Number(dataset.data)];

              const shouldFill =
                cleanedValues.chartType === 'area' || dataset.type === 'area';

              // If chart is pie/doughnut/polarArea, we can apply an array of colors if provided
              let finalBackgroundColor = dataset.backgroundColor || '#4caf50';
              if (
                ['pie', 'doughnut', 'polarArea'].includes(
                  cleanedValues.chartType
                ) &&
                segmentColorsArray.length > 0
              ) {
                finalBackgroundColor = segmentColorsArray;
              }

              return {
                label: dataset.label,
                data: parsedData,
                type: dataset.type || undefined,
                fill: shouldFill,
                backgroundColor: finalBackgroundColor,
                borderColor: dataset.borderColor || '#4caf50',
                borderWidth: dataset.borderWidth || 1,
              };
            }
          }),
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
              // If label text colors array is provided, use a function-based approach
              // to pick the color for each slice. Otherwise, just a single color:
              color:
                labelTextColorsArray.length > 0
                  ? (ctx: any) =>
                      labelTextColorsArray[ctx.dataIndex] || '#000'
                  : cleanedValues.dataLabelColor || '#000',
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
          gridLineColor: cleanedValues.gridLineColor || 'rgba(0, 0, 0, 0.1)',
          locale: cleanedValues.locale || 'en-US',
          dynamicUpdate: {
            enabled: cleanedValues.enableDynamicUpdates || false,
            interval: cleanedValues.updateInterval || 5,
          },
          gradientFills: {
            enabled: cleanedValues.useGradientFills || false,
            startColor:
              cleanedValues.gradientStartColor || 'rgba(75,192,192,0)',
            endColor:
              cleanedValues.gradientEndColor || 'rgba(75,192,192,0.4)',
          },
        } as ChartData;

        break;
      }

      case 'gantt': {
        const existingData = widget.data as GanttWidgetData;
        const existingTasks = existingData.tasks || [];
        const { arrowColor } = cleanedValues;

        const mergedTasks = existingTasks.map((oldTask) => {
          const updatedTask = cleanedValues.tasks.find(
            (t: any) => t.id === oldTask.id
          );
          if (!updatedTask) {
            return oldTask;
          }
          return {
            ...oldTask,
            name: updatedTask.name,
            start: updatedTask.start.format('YYYY-MM-DD'),
            end: updatedTask.end.format('YYYY-MM-DD'),
            completed: updatedTask.completed
              ? updatedTask.completed.format('YYYY-MM-DD')
              : undefined,
            progress: updatedTask.progress,
            dependencies: Array.isArray(updatedTask.dependencies)
              ? updatedTask.dependencies
              : (updatedTask.dependencies || '').split(','),
            color: updatedTask.color || oldTask.color,
            progressColor:
              updatedTask.progressColor || oldTask.progressColor,
          };
        });

        const newTasks = (cleanedValues.tasks || [])
          .filter(
            (t: any) => !existingTasks.some((old) => old.id === t.id)
          )
          .map((t: any) => ({
            id: t.id,
            name: t.name,
            start: t.start.format('YYYY-MM-DD'),
            end: t.end.format('YYYY-MM-DD'),
            completed: t.completed
              ? t.completed.format('YYYY-MM-DD')
              : undefined,
            progress: t.progress,
            dependencies: Array.isArray(t.dependencies)
              ? t.dependencies
              : (t.dependencies || '').split(','),
            color: t.color || '#FF0000',
            progressColor: t.progressColor || '#00AABB',
          }));

        const finalTasks = [...mergedTasks, ...newTasks];
        updatedData = {
          ...existingData,
          tasks: finalTasks,
          title: cleanedValues.title,
          arrowColor: arrowColor,
        } as GanttWidgetData;
        break;
      }

      case 'metric': {
        updatedData = {
          ...cleanedValues,
          displayName: cleanedValues.displayName || 'Metric',
          titleAlignment: cleanedValues.titleAlignment || 'left',
          worksheetName: cleanedValues.worksheetName,
          cellAddress: cleanedValues.cellAddress,
        };
        break;
      }

      default: {
        updatedData = {};
        break;
      }
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
            <Select 
              onChange={(value)=> {
                setChartType(value);
                const currentDatasets = form.getFieldValue('datasets') || [];
                const updatedDatasets = currentDatasets.map((ds: any) => ({
                  ...ds,
                  type: value,
                }));
                form.setFieldsValue({ datasets: updatedDatasets });
              }}
            >
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
            name="labels"
            label="Labels (comma-separated)"
            rules={[
              { required: true, message: 'Please enter labels' },
            ]}
          >
            <Input />
          </Form.Item>
          {/* If Pie/Doughnut/PolarArea, let user define slice (segment) colors */}
          {['pie', 'doughnut', 'polarArea'].includes(chartType) && (
            <>
              <Form.Item
                name="segmentColors"
                label="Slice Colors (comma-separated)"
              >
                <Input placeholder="#FF6384, #36A2EB, #FFCE56" />
              </Form.Item>
              <Form.Item
                name="labelTextColors"
                label="Slice Label Text Colors (comma-separated)"
              >
                <Input placeholder="#000, #111, #222" />
              </Form.Item>
            </>
          )}
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
                      const mainChartType = form.getFieldValue('chartType') || 'bar';
                      if (
                        [
                          'bar',
                          'line',
                          'pie',
                          'doughnut',
                          'radar',
                          'polarArea',
                        ].includes(mainChartType)
                      ) {
                        if (data.length < 2) {
                          message.error(
                            'Data range must contain at least a header row and one row of data.'
                          );
                          return;
                        }
                        const labels = data[0].slice(1);
                        const datasets = data.slice(1).map((row) => ({
                          label: row[0],
                          data: row.slice(1).join(', '),
                          type: mainChartType,
                          backgroundColor: getRandomColor(),
                          borderColor: getRandomColor(),
                          borderWidth: 1,
                        }));
                        form.setFieldsValue({
                          labels: labels.join(', '),
                          datasets,
                        });
                      } else if (mainChartType === 'scatter') {
                        // SCATTER
                        if (data.length < 3) {
                          message.error(
                            'Scatter data requires at least 3 rows: header row, X row, and Y row.'
                          );
                          return;
                        }
                        const xRow = data[1];
                        const yRow = data[2];
                        const xVals = xRow.slice(1).map((val: any) => Number(val));
                        const yVals = yRow.slice(1).map((val: any) => Number(val));

                        if (xVals.length !== yVals.length) {
                          message.error(
                            'X row and Y row must have the same number of points.'
                          );
                          return;
                        }

                        // Build array of { x, y }
                        const dataPoints = xVals.map((xVal: number, idx: number) => ({
                          x: xVal,
                          y: yVals[idx],
                        }));

                        const scatterDataset = {
                          label: 'Scatter Series',
                          data: dataPoints,
                          type: 'scatter',
                          backgroundColor: getRandomColor(),
                          borderColor: getRandomColor(),
                          borderWidth: 1,
                        };

                        form.setFieldsValue({
                          labels: '',
                          datasets: [scatterDataset],
                        });
                      } else if (mainChartType === 'bubble') {
                        // BUBBLE
                        if (data.length < 4) {
                          message.error(
                            'Bubble data requires at least 4 rows: header row, X row, Y row, and R row.'
                          );
                          return;
                        }
                        const xRow = data[1];
                        const yRow = data[2];
                        const rRow = data[3];

                        const xVals = xRow.slice(1).map((val: any) => Number(val));
                        const yVals = yRow.slice(1).map((val: any) => Number(val));
                        const rVals = rRow.slice(1).map((val: any) => Number(val));

                        if (
                          xVals.length !== yVals.length ||
                          yVals.length !== rVals.length
                        ) {
                          message.error(
                            'X, Y, and R rows must each have the same number of points.'
                          );
                          return;
                        }

                        const dataPoints = xVals.map((xVal: number, idx: number) => ({
                          x: xVal,
                          y: yVals[idx],
                          r: rVals[idx],
                        }));

                        const bubbleDataset = {
                          label: 'Bubble Series',
                          data: dataPoints,
                          type: 'bubble',
                          backgroundColor: getRandomColor(),
                          borderColor: getRandomColor(),
                          borderWidth: 1,
                        };

                        form.setFieldsValue({
                          labels: '',
                          datasets: [bubbleDataset],
                        });
                      }
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
                      initialValue="bar"
                      rules={[
                        {
                          required: true,
                          message:
                            'Please select chart type for this dataset',
                        },
                      ]}
                    >
                      <Select>
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
            {!['pie', 'doughnut', 'polarArea', 'radar'].includes(chartType) && (
              <>
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
                  <Form.Item label="Data Label Font Size" name="dataLabelFontSize">
                    <InputNumber min={8} max={24} />
                  </Form.Item>
                  <Form.Item
                    label="Enable Tooltips"
                    name="enableTooltips"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item label="Tooltip Template" name="tooltipTemplate">
                    <TextArea
                      placeholder="Use {label} and {value} placeholders"
                      rows={3}
                    />
                  </Form.Item>
                  <Form.Item label="Annotations">
                    <Form.List name="annotations">
                      {(annotationFields, { add, remove }) => (
                        <>
                          {annotationFields.map(({ key, name, ...restField }) => (
                            <div key={key} style={{ marginBottom: 16 }}>
                              <Form.Item
                                {...restField}
                                name={[name, 'type']}
                                label="Annotation Type"
                                rules={[
                                  {
                                    required: true,
                                    message: 'Please select annotation type',
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
              </>
            )}
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
          {/* Gantt Title */}
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
            {(fields) => (
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
                    <Form.Item {...restField} name={[name, 'id']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      label="Task Name"
                      tooltip="Non-editable"
                    >
                      <Input disabled />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'color']}
                      label="Task Color"
                      rules={[{ required: true, message: 'Please pick a task color' }]}
                    >
                      <Input type="color" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'progressColor']}
                      label="Progress Fill Color"
                      initialValue="#00AABB"
                    >
                      <Input type="color" />
                    </Form.Item>
                  </div>
                ))}
              </>
            )}
          </Form.List>
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
