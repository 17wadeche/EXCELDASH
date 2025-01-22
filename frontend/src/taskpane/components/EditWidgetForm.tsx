/// <reference types="office-js" />
// src/taskpane/components/EditWidgetForm.tsx

import React, { useEffect, useState, useContext } from 'react';
import {
  Form,
  Input,
  Button,
  InputNumber,
  message,
  Select,
  Switch,
  Collapse,
  DatePicker,
} from 'antd';
import {
  MinusCircleOutlined,
  PlusOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { DashboardContext } from '../context/DashboardContext';
import {
  Widget,
  TextData,
  ChartData,
  GanttWidgetData,
  MetricData,
  TitleWidgetData,
  Task,
} from './types';
import { fill } from 'lodash';

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

interface EditWidgetFormProps {
  widget: Widget;
  onSubmit: (
    updatedData:
      | TextData
      | ChartData
      | GanttWidgetData
      | MetricData
      | TitleWidgetData
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
  const [chartType, setChartType] = useState<string>(
    widget.type === 'chart' ? (widget.data as ChartData).type : 'bar'
  );

  useEffect(() => {
    setSheets(availableWorksheets);
  }, [availableWorksheets]);

  const getInitialValues = () => {
    switch (widget.type) {
      case 'text': {
        return widget.data as TextData;
      }
      case 'title': {
        return widget.data as TitleWidgetData;
      }
      case 'chart': {
        const data = widget.data as ChartData;
        const useArea = data.type === 'line' && data.datasets.some((ds) => ds.fill);
        return {
          title: data.title || 'Chart',
          chartType: useArea ? 'area' : data.type,
          labels: (data.labels || []).join(', '),
          worksheetName: data.worksheetName || sheets[0] || '',
          associatedRange: data.associatedRange || '',
          titleAlignment: data.titleAlignment || 'left',
          xAxisType: data.scales?.x?.type || 'category',
          xAxisTitle: data.scales?.x?.title?.text || '',
          yAxisType: data.scales?.y?.type || 'linear',
          yAxisTitle: data.scales?.y?.title?.text || '',
          showLegend: data.plugins?.legend?.display !== false,
          legendPosition: data.plugins?.legend?.position || 'bottom',
          annotations: data.plugins?.annotation?.annotations || [],
          showDataLabels: data.plugins?.datalabels?.display !== false,
          dataLabelColor: data.plugins?.datalabels?.color || '#36A2EB',
          dataLabelFontSize: data.plugins?.datalabels?.font?.size || 12,
          enableTooltips: data.plugins?.tooltip?.enabled !== false,
          tooltipTemplate: '',
          enableZoom: data.plugins?.zoom?.zoom?.wheel?.enabled || false,
          enablePan: data.plugins?.zoom?.pan?.enabled || false,
          zoomMode: data.plugins?.zoom?.zoom?.mode || 'xy',
          chartBackgroundColor: data.backgroundColor || '#ffffff',
          gridLineColor: data.gridLineColor || 'rgba(0,0,0,0.1)',
          locale: data.locale || 'en-US',
          enableDynamicUpdates: data.dynamicUpdate?.enabled || false,
          updateInterval: data.dynamicUpdate?.interval || 5,
          useGradientFills: data.gradientFills?.enabled || false,
          gradientStartColor: data.gradientFills?.startColor || 'rgba(75,192,192,0)',
          gradientEndColor: data.gradientFills?.endColor || 'rgba(75,192,192,0.4)',
          datasets: (data.datasets || []).map((ds) => ({
            label: ds.label,
            data: Array.isArray(ds.data) ? ds.data.join(', ') : ds.data,
            type: ds.type || 'bar',
            backgroundColor: ds.backgroundColor,
            borderColor: ds.borderColor,
            borderWidth: ds.borderWidth,
          })),
        };
      }
      case 'gantt': {
        const data = widget.data as GanttWidgetData;
        return {
          title: data.title || 'Gantt Chart',
          tasks: (data.tasks || []).map((task) => ({
            ...task,
            start: moment(task.start),
            end: moment(task.end),
            dependencies: task.dependencies
              ? task.dependencies.toString()
              : '',
          })),
        };
      }
      case 'metric': {
        const data = widget.data as MetricData;
        return {
          ...data,
          titleAlignment: data.titleAlignment || 'left',
          worksheetName: data.worksheetName || sheets[0] || '',
          cellAddress: data.cellAddress || '',
        };
      }
      default:
        return {};
    }
  };

  useEffect(() => {
    form.setFieldsValue(getInitialValues());
    if (widget.type === 'chart') {
      const cData = widget.data as ChartData;
      setChartType(cData.type);
    }
  }, [widget]);

  useEffect(() => {
    if (widget.type !== 'chart') return;
    if (chartType !== 'bubble') return;
    const datasets = form.getFieldValue('datasets') || [];
    if (!datasets.length || datasets[0].type !== 'bubble') return;
    const bubbleDataStr = datasets[0].data || '';
    const segments = bubbleDataStr.split(';').map((s: string) => s.trim()).filter(Boolean);
    let currentBubbleColors = form.getFieldValue('bubbleColors');
    if (!Array.isArray(currentBubbleColors) || currentBubbleColors.length !== segments.length) {
      currentBubbleColors = segments.map(() => ({ color: '#36A2EB' }));
      form.setFieldsValue({ bubbleColors: currentBubbleColors });
    }
  }, [chartType, form, widget.type]);

  const handleFinish = (values: any) => {
    const cleanedValues: Record<string, any> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        cleanedValues[k] = v;
      }
    });
    let updatedData: any;
    switch (widget.type) {
      case 'text': {
        updatedData = cleanedValues;
        break;
      }
      case 'title': {
        updatedData = cleanedValues;
        break;
      }
      case 'chart': {
        const finalChartType =
          cleanedValues.chartType === 'area' ? 'line' : cleanedValues.chartType;
        const noAxisTypes = ['pie', 'doughnut', 'polarArea', 'radar', 'bubble'];
        let sliceColorsArray: string[] = [];
        if (['pie', 'doughnut', 'polarArea'].includes(finalChartType)) {
          const sc: { color: string }[] = cleanedValues.sliceColors || [];
          sliceColorsArray = sc.map((obj) => obj.color);
        }
        updatedData = {
          title: cleanedValues.title,
          type: finalChartType,
          worksheetName: cleanedValues.worksheetName,
          associatedRange: cleanedValues.associatedRange,
          labels: cleanedValues.labels
            ? cleanedValues.labels.split(',').map((l: string) => l.trim())
            : [],
          datasets: (cleanedValues.datasets || []).map((ds: any) => {
            if (ds.type === 'scatter' || ds.type === 'bubble') {
              const segments = ds.data
                .split(';')
                .map((s: string) => s.trim())
                .filter(Boolean);
              if (ds.type === 'bubble') {
                const points = segments.map((seg: string) => {
                  const [x, y, r] = seg.split(',').map((v: string) => parseFloat(v.trim()));
                  return { x, y, r };
                });
                const bubbleColors = cleanedValues.bubbleColors || [];
                const backgroundColors = bubbleColors.map((c: any) => c.color);
                return {
                  label: ds.label,
                  type: ds.type,
                  data: points,
                  fill: false,
                  backgroundColor: backgroundColors,
                  borderColor: ds.borderColor || '#4caf50',
                  borderWidth: ds.borderWidth || 1,
                };
              }
              else {
                const points = segments.map((seg: string) => {
                  const [x, y] = seg.split(',').map((v: string) => parseFloat(v.trim()));
                  return { x, y };
                });
                return {
                  label: ds.label,
                  type: ds.type,
                  data: points,
                  fill: false,
                  backgroundColor: ds.backgroundColor || '#4caf50',
                  borderColor: ds.borderColor || '#4caf50',
                  borderWidth: ds.borderWidth || 1,
                };
              }
            }
            else {
              let parsedValues: number[] = [];
              if (typeof ds.data === 'string') {
                parsedValues = ds.data
                  .split(',')
                  .map((num: string) => Number(num.trim()));
              } else if (Array.isArray(ds.data)) {
                parsedValues = ds.data.map((n: any) => Number(n));
              } else {
                parsedValues = [Number(ds.data)];
              }
              const shouldFill =
                cleanedValues.chartType === 'area' || ds.type === 'area';
              let finalBg = ds.backgroundColor || '#4caf50';
              if (
                ['pie', 'doughnut', 'polarArea'].includes(finalChartType) &&
                sliceColorsArray.length
              ) {
                finalBg = sliceColorsArray;
              }
              return {
                label: ds.label,
                data: parsedValues,
                type: ds.type,
                fill: shouldFill,
                backgroundColor: finalBg,
                borderColor: ds.borderColor || '#4caf50',
                borderWidth: ds.borderWidth || 1,
              };
            }
          }),
          titleAlignment: cleanedValues.titleAlignment || 'left',
          scales: noAxisTypes.includes(finalChartType)
            ? {}
            : {
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
          gridLineColor: cleanedValues.gridLineColor || 'rgba(0, 0, 0, 0.1)',
          locale: cleanedValues.locale || 'en-US',
          dynamicUpdate: {
            enabled: cleanedValues.enableDynamicUpdates || false,
            interval: cleanedValues.updateInterval || 5,
          },
          gradientFills: {
            enabled: cleanedValues.useGradientFills || false,
            startColor: cleanedValues.gradientStartColor || 'rgba(75,192,192,0)',
            endColor: cleanedValues.gradientEndColor || 'rgba(75,192,192,0.4)',
          },
        } as ChartData;
      
        break;
      }
      case 'gantt': {
        const existing = widget.data as GanttWidgetData;
        const existingTasks = existing.tasks || [];
        const { arrowColor } = cleanedValues;
        const mergedTasks = existingTasks.map((oldTask) => {
          const updated = (cleanedValues.tasks || []).find(
            (t: any) => t.id === oldTask.id
          );
          if (!updated) return oldTask;
          return {
            ...oldTask,
            name: updated.name,
            start: updated.start.format('YYYY-MM-DD'),
            end: updated.end.format('YYYY-MM-DD'),
            completed: updated.completed
              ? updated.completed.format('YYYY-MM-DD')
              : undefined,
            progress: updated.progress,
            dependencies: Array.isArray(updated.dependencies)
              ? updated.dependencies
              : (updated.dependencies || '').split(','),
            color: updated.color || oldTask.color,
            progressColor: updated.progressColor || oldTask.progressColor,
          };
        });
        const newTasks = (cleanedValues.tasks || [])
          .filter((t: any) => !existingTasks.some((old) => old.id === t.id))
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
        updatedData = {
          ...existing,
          tasks: [...mergedTasks, ...newTasks],
          title: cleanedValues.title,
          arrowColor,
        };
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
      default:
        updatedData = {};
    }
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
      layout="vertical"
      initialValues={getInitialValues()}
      onFinish={handleFinish}
    >
      {widget.type === 'text' && (
        <>
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: 'Please enter content' }]}
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
            rules={[
              { required: true, message: 'Please enter the title text' },
            ]}
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
            rules={[{ required: true, message: 'Please select chart type' }]}
          >
            <Select
              onChange={(value: string) => {
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
            rules={[{ required: true, message: 'Please enter labels' }]}
          >
            <Input />
          </Form.Item>
          {['pie', 'doughnut', 'polarArea'].includes(chartType) && (
            <Form.List name="sliceColors">
              {(fields) => {
                const rawLabels = form.getFieldValue('labels') || '';
                const labelArr = rawLabels
                  .split(',')
                  .map((l: string) => l.trim())
                  .filter(Boolean);
                return (
                  <>
                    {fields.map(({ key, name, ...restField }) => {
                      const sliceLabel = labelArr[key] || `Slice #${key + 1}`;
                      return (
                        <Form.Item
                          {...restField}
                          key={key}
                          label={`Color for ${sliceLabel}`}
                          name={[name, 'color']}
                        >
                          <Input type="color" />
                        </Form.Item>
                      );
                    })}
                  </>
                );
              }}
            </Form.List>
          )}
          <Form.Item
            name="worksheetName"
            label="Worksheet"
            rules={[{ required: true, message: 'Please select a worksheet' }]}
          >
            <Select placeholder="Select worksheet">
              {availableWorksheets.map((sheet) => (
                <Option key={sheet} value={sheet}>
                  {sheet}
                </Option>
              ))}
            </Select>
          </Form.Item>
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
          {!isPresenterMode && (
            <Form.Item>
              <Button
                type="primary"
                icon={<SelectOutlined />}
                onClick={async () => {
                  if (isPresenterMode) {
                    message.warning(
                      'Loading data from Excel is not available in full-screen mode.'
                    );
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
                      const worksheet = context.workbook.worksheets.getItem(
                        worksheetName
                      );
                      const dataRange = worksheet.getRange(associatedRange);
                      dataRange.load('values');
                      await context.sync();
                      const data = dataRange.values;
                      const mainType = form.getFieldValue('chartType');
                      console.log('Loaded data:', data);
                      if (
                        [
                          'bar',
                          'line',
                          'pie',
                          'doughnut',
                          'radar',
                          'polarArea',
                        ].includes(mainType)
                      ) {
                        if (data.length < 2) {
                          message.error(
                            'Your selected range must have at least 2 rows (header + data).'
                          );
                          return;
                        }
                        const labels = data[0].slice(1);
                        const datasets = data.slice(1).map((row: any[]) => ({
                          label: row[0],
                          data: row.slice(1).join(', '),
                          type: mainType,
                          backgroundColor: getRandomColor(),
                          borderColor: getRandomColor(),
                          borderWidth: 1,
                        }));
                        form.setFieldsValue({
                          labels: labels.join(', '),
                          datasets,
                        });
                      } else if (mainType === 'scatter') {
                        if (data.length < 3) {
                          message.error(
                            'Scatter data requires at least 3 rows: header row, X row, and Y row.'
                          );
                          return;
                        }
                        const xRow = data[1];
                        const yRow = data[2];
                        const xVals = xRow.slice(1).map((v: any) => Number(v));
                        const yVals = yRow.slice(1).map((v: any) => Number(v));
                        if (xVals.length !== yVals.length) {
                          message.error(
                            'X row and Y row must have the same number of points.'
                          );
                          return;
                        }
                        const points = xVals.map((x: number, idx: number) => ({
                          x,
                          y: yVals[idx],
                        }));
                        form.setFieldsValue({
                          labels: '',
                          datasets: [
                            {
                              label: 'Scatter Series',
                              data: points,
                              type: 'scatter',
                              backgroundColor: getRandomColor(),
                              borderColor: getRandomColor(),
                              borderWidth: 1,
                            },
                          ],
                        });
                      } else if (mainType === 'bubble') {
                        if (data.length < 4) {
                          message.error(
                            'Bubble data requires at least 4 rows: header row, X row, Y row, R row.'
                          );
                          return;
                        }
                        const xRow = data[1];
                        const yRow = data[2];
                        const rRow = data[3];
                        const xVals = xRow.slice(1).map((v: any) => Number(v));
                        const yVals = yRow.slice(1).map((v: any) => Number(v));
                        const rVals = rRow.slice(1).map((v: any) => Number(v));
                        const headerRow = data[0].slice(1);
                        const labelsStr = headerRow.join(', ');
                        if (
                          xVals.length !== yVals.length ||
                          yVals.length !== rVals.length
                        ) {
                          message.error(
                            'X, Y, and R rows must each have the same number of points.'
                          );
                          return;
                        }
                        const points = xVals.map((x: number, idx: number) => ({
                          x,
                          y: yVals[idx],
                          r: rVals[idx],
                        }));
                        const dataString = points
                          .map((pt: { x: number; y: number; r: number }) => `${pt.x},${pt.y},${pt.r}`)
                          .join(';');
                        form.setFieldsValue({
                          labels: labelsStr,
                          datasets: [
                            {
                              label: 'Bubble Series',
                              data: dataString,
                              type: 'bubble',
                              backgroundColor: getRandomColor(),
                              borderColor: getRandomColor(),
                              borderWidth: 1,
                            },
                          ],
                        });
                      }
                      message.success('Data loaded successfully from Excel.');
                    });
                  } catch (err) {
                    console.error('Error loading Excel data:', err);
                    message.error('Failed to load data from Excel.');
                  }
                }}
              >
                Select and Load Data from Excel
              </Button>
            </Form.Item>
          )}
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
                      initialValue="line"
                      rules={[
                        {
                          required: true,
                          message: 'Please select chart type for this dataset',
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
                            const dsType = form.getFieldValue(['datasets', name, 'type']);
                            if (!value) return Promise.resolve();
                            if (dsType === 'bubble') {
                              const segments = value
                                .split(';')
                                .map((s: string) => s.trim())
                                .filter(Boolean);
                              for (let seg of segments) {
                                const parts = seg.split(',').map((v: string) => v.trim());
                                if (parts.length !== 3 || parts.some((p: string) => isNaN(Number(p)))) {
                                  return Promise.reject(
                                    new Error('Bubble data must be "x,y,r" triplets, separated by semicolons.')
                                  );
                                }
                              }
                            } else if (dsType === 'scatter') {
                              const segments = value.split(';').map((s: string) => s.trim()).filter(Boolean);
                              for (let seg of segments) {
                                const parts = seg.split(',').map((v: string) => v.trim());
                                if (parts.length !== 2 || parts.some((p: string) => isNaN(Number(p)))) {
                                  return Promise.reject(
                                    new Error('Scatter data must be "x,y" pairs, separated by semicolons.')
                                  );
                                }
                              }
                            } else {
                              const isNumArray = value
                                .split(',')
                                .map((v:string) => v.trim())
                                .every((v: string) => !isNaN(Number(v)));
                              if (!isNumArray) {
                                return Promise.reject(new Error('Data points must be comma-separated numbers.'));
                              }
                            }
                            return Promise.resolve();
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
                          message: 'Please pick a background color',
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
                          message: 'Please pick a border color',
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
                      style={{ marginTop: 8 }}
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
          {chartType === 'bubble' && (
            <Collapse>
              <Collapse.Panel header="Bubble Colors" key="bubbleColors">
                <Form.List name="bubbleColors">
                  {(fields) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Form.Item
                          {...restField}
                          key={key}
                          name={[name, 'color']}
                          label={`Color for Bubble #${key + 1}`}
                        >
                          <Input type="color" />
                        </Form.Item>
                      ))}
                    </>
                  )}
                </Form.List>
              </Collapse.Panel>
            </Collapse>
          )}
          <Collapse>
            {!['pie', 'doughnut', 'polarArea', 'radar', 'bubble'].includes(chartType) && (
              <>
                <Panel header="Axis Settings" key="axis">
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
                <Panel header="Plugins" key="plugins">
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
                      rows={2}
                    />
                  </Form.Item>
                  <Form.Item label="Annotations">
                    <Form.List name="annotations">
                      {(annFields, { add, remove }) => (
                        <>
                          {annFields.map(({ key, name, ...restField }) => (
                            <div key={key} style={{ marginBottom: 16 }}>
                              <Form.Item
                                {...restField}
                                name={[name, 'type']}
                                label="Annotation Type"
                                rules={[
                                  { required: true, message: 'Select type' },
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
                                  { required: true, message: 'Enter value' },
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
                                  { required: true, message: 'Pick a color' },
                                ]}
                              >
                                <Input type="color" />
                              </Form.Item>
                              <Button
                                type="dashed"
                                onClick={() => remove(name)}
                                icon={<MinusCircleOutlined />}
                              >
                                Remove
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
                <Panel header="Legend" key="legend">
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
                <Panel header="Styling" key="styling">
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
                  <Form.Item label="Gradient End Color" name="gradientEndColor">
                    <Input type="color" />
                  </Form.Item>
                </Panel>
              </>
            )}
          </Collapse>
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
                      rules={[
                        { required: true, message: 'Please pick a task color' },
                      ]}
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
            rules={[{ required: true, message: 'Please select a worksheet' }]}
          >
            <Select placeholder="Select worksheet">
              {availableWorksheets.map((sheet) => (
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
              { required: true, message: 'Please select a cell' },
              {
                pattern: /^[A-Za-z]{1,3}[1-9][0-9]{0,6}$/,
                message: 'Please enter a valid cell address (e.g., E8)',
              },
            ]}
          >
            <Input placeholder="e.g., E8" />
          </Form.Item>
          <Form.Item>
            <Button
              icon={<SelectOutlined />}
              onClick={async () => {
                if (Office.context.ui?.messageParent) {
                  Office.context.ui.messageParent(
                    JSON.stringify({ type: 'selectCell', widgetId })
                  );
                } else {
                  try {
                    await Excel.run(async (context) => {
                      const rng = context.workbook.getSelectedRange();
                      rng.load(['address', 'worksheet']);
                      await context.sync();
                      const selectedSheet = rng.worksheet;
                      selectedSheet.load('name');
                      await context.sync();
                      const sheetName = selectedSheet.name;
                      const address = rng.address.includes('!')
                        ? rng.address.split('!')[1]
                        : rng.address;
                      form.setFieldsValue({
                        cellAddress: address,
                        worksheetName: sheetName,
                      });
                    });
                  } catch (err) {
                    console.error('Error selecting cell:', err);
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
            <Input placeholder="Optional name to display" />
          </Form.Item>
          <Form.Item
            name="targetValue"
            label="Target Value"
            rules={[
              { required: true, message: 'Please enter a target value' },
            ]}
          >
            <InputNumber placeholder="Enter target" />
          </Form.Item>
          <Form.Item
            name="comparison"
            label="Comparison Type"
            rules={[
              { required: true, message: 'Please select a comparison type' },
            ]}
          >
            <Select placeholder="Select comparison type">
              <Option value="greater">Greater or Equal</Option>
              <Option value="less">Less or Equal</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="fontSize"
            label="Font Size"
            rules={[
              { required: true, message: 'Please enter a font size' },
            ]}
          >
            <InputNumber min={12} max={100} placeholder="Font size" />
          </Form.Item>
          <Form.Item name="titleAlignment" label="Title Alignment">
            <Select>
              <Option value="left">Left</Option>
              <Option value="center">Center</Option>
            </Select>
          </Form.Item>
        </>
      )}
      <Form.Item style={{ marginTop: 16 }}>
        <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
          Save
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </Form.Item>
    </Form>
  );
};

export default EditWidgetForm;
