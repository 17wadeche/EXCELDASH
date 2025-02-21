/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable office-addins/load-object-before-read */
/* eslint-disable no-undef */
/// <reference types="office-js" />
// src/taskpane/components/EditWidgetForm.tsx

import React, { useEffect, useState, useContext } from "react";
import { Form, Input, Space, Button, InputNumber, message, Select, Switch, Collapse, Radio } from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  SelectOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { DashboardContext } from "../context/DashboardContext";
import { Widget, TextData, ChartData, GanttWidgetData, MetricData, TitleWidgetData } from "./types";

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

interface EditWidgetFormProps {
  widget: Widget;
  onSubmit: (updatedData: TextData | ChartData | GanttWidgetData | MetricData | TitleWidgetData) => void;
  onCancel: () => void;
  isPresenterMode?: boolean;
  initialZIndex?: number;
}

const EditWidgetForm: React.FC<EditWidgetFormProps> = ({ widget, onSubmit, onCancel, isPresenterMode }) => {
  const [form] = Form.useForm();
  const widgetId = widget.id;
  const { availableWorksheets, widgets } = useContext(DashboardContext)!;
  const [sheets, setSheets] = useState<string[]>([]);
  const [chartType, setChartType] = useState<string>(widget.type === "chart" ? (widget.data as ChartData).type : "bar");
  const [zIndex, setZIndex] = useState<number>(widget.zIndex || 0);
  useEffect(() => {
    const initialValues = getInitialValues();
    form.setFieldsValue({
      ...initialValues,
      zIndex: widget.zIndex || 0,
    });
  }, [widget, form]);
  useEffect(() => {
    setSheets(availableWorksheets);
  }, [availableWorksheets]);
  const defaultTreemapFormatter = (ctx: any) => {
    if (ctx.type !== "data") return "";
    const node = ctx.raw?._data;
    if (!node) return "";
    return [node.name, `(${ctx.raw.v})`];
  };
  const getInitialValues = () => {
    switch (widget.type) {
      case "text":
        return widget.data as TextData;
      case "title":
        return widget.data as TitleWidgetData;
      case "chart": {
        const data = widget.data as ChartData;
        const useArea = data.type === "line" && data.datasets.some((ds) => ds.fill);
        const initialValues: any = {
          zIndex: widget.zIndex || 0,
          title: data.title || "Chart",
          chartType: useArea ? "area" : data.type,
          labels: (data.labels || []).join(", "),
          worksheetName: data.worksheetName || sheets[0] || "",
          associatedRange: data.associatedRange || "",
          titleAlignment: data.titleAlignment || "left",
          xAxisType: data.scales?.x?.type || "category",
          xAxisTitle: data.scales?.x?.title?.text || "",
          yAxisType: data.scales?.y?.type || "linear",
          yAxisTitle: data.scales?.y?.title?.text || "",
          showLegend: data.plugins?.legend?.display !== false,
          legendPosition: data.plugins?.legend?.position || "bottom",
          showDataLabels: data.plugins?.datalabels?.display ?? false,
          dataLabelColor: data.plugins?.datalabels?.color || "#36A2EB",
          dataLabelFontSize: data.plugins?.datalabels?.font?.size || 12,
          enableTooltips: data.plugins?.tooltip?.enabled !== false,
          tooltipTemplate: "",
          enableZoom: data.plugins?.zoom?.zoom?.wheel?.enabled || false,
          enablePan: data.plugins?.zoom?.pan?.enabled || false,
          zoomMode: data.plugins?.zoom?.zoom?.mode || "xy",
          chartBackgroundColor: data.backgroundColor || "#ffffff",
          gridLineColor: data.gridLineColor || "rgba(0,0,0,0.1)",
          locale: data.locale || "en-US",
          enableDynamicUpdates: data.dynamicUpdate?.enabled || false,
          updateInterval: data.dynamicUpdate?.interval || 5,
          datasets: (data.datasets || []).map((ds) => {
            let dataString = "";
            if ((ds.type as string) === "scatter" && Array.isArray(ds.data)) {
              dataString = (ds.data as Array<{ x: number; y: number }>)
                .map((point) => `${point.x},${point.y}`)
                .join("; ");
            } else if ((ds.type as string) === "bubble" && Array.isArray(ds.data)) {
              dataString = (ds.data as Array<{ x: number; y: number; r: number }>)
                .map((point) => `${point.x},${point.y},${point.r}`)
                .join("; ");
            } else if ((ds.type as String) === "boxplot" && Array.isArray(ds.data)) {
              dataString = JSON.stringify(ds.data);
            } else if (Array.isArray(ds.data)) {
              dataString = ds.data.join(", ");
            } else {
              dataString = ds.data;
            }
            return {
              label: ds.label,
              data: dataString,
              type: ds.type || "bar",
              backgroundColor: ds.backgroundColor,
              borderColor: ds.borderColor,
              borderWidth: ds.borderWidth,
            };
          }),
        };
        if (["pie", "doughnut", "polarArea"].includes(data.type)) {
          const dataset = data.datasets[0];
          if (dataset.backgroundColor && Array.isArray(dataset.backgroundColor)) {
            initialValues.sliceColors = dataset.backgroundColor.map((color: string) => ({ color }));
          } else {
            initialValues.sliceColors = [];
          }
        }
        if (data.type === "bubble") {
          const dataset = data.datasets[0];
          if (dataset.backgroundColor && Array.isArray(dataset.backgroundColor)) {
            initialValues.bubbleColors = dataset.backgroundColor.map((color: string) => ({ color }));
          } else {
            initialValues.bubbleColors = [];
          }
        }
        if (data.type === "funnel") {
          const dataset = data.datasets[0];
          if (dataset.backgroundColor && Array.isArray(dataset.backgroundColor)) {
            initialValues.funnelColors = dataset.backgroundColor.map((color: string) => ({ color }));
          } else {
            initialValues.funnelColors = [];
          }
        }
        if (data.type === "treemap") {
          const dsAny = data.datasets[0] as any;
          dsAny.plugins = dsAny.plugins || {};
          dsAny.plugins.datalabels = dsAny.plugins.datalabels || {};
          dsAny.plugins.datalabels.display = true;
          dsAny.labels = dsAny.labels || {};
          if (typeof dsAny.labels.display === "undefined") {
            dsAny.labels.display = true;
          }
          if (Array.isArray(dsAny.tree)) {
            initialValues.datasets = initialValues.datasets || [];
            initialValues.datasets = [
              {
                ...dsAny,
                tree: dsAny.tree,
                plugins: {
                  datalabels: {
                    display: true,
                  },
                },
                labels: {
                  display: true,
                  formatter: dsAny.labels.formatter,
                },
              },
            ];
          }
        }
        return initialValues;
      }
      case "gantt": {
        const data = widget.data as GanttWidgetData;
        return {
          title: data.title || "Gantt Chart",
          tasks: (data.tasks || []).map((task) => ({
            ...task,
            start: moment(task.start),
            end: moment(task.end),
            dependencies: task.dependencies ? task.dependencies.toString() : "",
          })),
        };
      }
      case "metric": {
        const data = widget.data as MetricData;
        return {
          ...data,
          titleAlignment: data.titleAlignment || "left",
          worksheetName: data.worksheetName || sheets[0] || "",
          cellAddress: data.cellAddress || "",
        };
      }
      default:
        return {};
    }
  };
  useEffect(() => {
    setZIndex(widget.zIndex || 0);
    form.setFieldsValue(getInitialValues());
  }, [widget, form]);
  useEffect(() => {
    form.setFieldsValue(getInitialValues());
    if (widget.type === "chart") {
      const cData = widget.data as ChartData;
      setChartType(cData.type);
      if (["pie", "doughnut", "polarArea"].includes(cData.type)) {
        const ds0 = cData.datasets[0];
        if (Array.isArray(ds0.backgroundColor)) {
          form.setFieldsValue({
            sliceColors: ds0.backgroundColor.map((color: string) => ({ color })),
          });
        }
      }
      if (cData.type === "bubble") {
        const ds0 = cData.datasets[0];
        if (Array.isArray(ds0.backgroundColor)) {
          form.setFieldsValue({
            bubbleColors: ds0.backgroundColor.map((color: string) => ({ color })),
          });
        }
      }
      if (cData.type === "boxplot") {
        const ds0 = cData.datasets[0];
        if (Array.isArray(ds0.backgroundColor)) {
          form.setFieldsValue({
            boxplotSampleColors: ds0.backgroundColor.map((color: string) => ({ color })),
          });
        }
      }
    }
    setZIndex(widget.zIndex || 0);
  }, [widget, form]);
  useEffect(() => {
    const { maxZ, minZ } = getZIndexBounds();
    setZIndex(widget.zIndex || maxZ + 1);
  }, [widgets]);
  const getZIndexBounds = () => {
    const zIndices = widgets?.map((w) => w.zIndex || 0) || [0];
    return {
      maxZ: Math.max(...zIndices),
      minZ: Math.min(...zIndices),
    };
  };
  const renderZIndexControls = () => {
    const { maxZ, minZ } = getZIndexBounds();
    return (
      <Form.Item label="Layer Position" name="zIndex">
        <Space>
          <InputNumber min={0} value={zIndex} onChange={(value) => setZIndex(value || 0)} />
          <Radio.Group
            onChange={(e) => {
              const newZ = e.target.value === "front" ? maxZ + 1 : Math.max(0, minZ - 1);
              setZIndex(newZ);
              form.setFieldsValue({ zIndex: newZ });
            }}
          >
            <Radio.Button value="front">
              <Space>
                <ArrowUpOutlined />
                Bring to Front
              </Space>
            </Radio.Button>
            <Radio.Button value="back">
              <Space>
                <ArrowDownOutlined />
                Send to Back
              </Space>
            </Radio.Button>
          </Radio.Group>
        </Space>
      </Form.Item>
    );
  };
  const handleFinish = (values: any) => {
    const cleanedValues: Record<string, any> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== "") {
        cleanedValues[k] = v;
      }
    });
    cleanedValues.zIndex = values.zIndex || 0;
    let updatedData: any;
    switch (widget.type) {
      case "text": {
        updatedData = cleanedValues;
        break;
      }
      case "title": {
        updatedData = cleanedValues;
        break;
      }
      case "chart": {
        const finalChartType = cleanedValues.chartType === "area" ? "line" : cleanedValues.chartType;
        const noAxisTypes = ["pie", "doughnut", "polarArea", "radar", "funnel", "treemap"];
        let sliceColorsArray: string[] = [];
        let bubbleColorsArray: string[] = [];
        if (["pie", "doughnut", "polarArea"].includes(finalChartType)) {
          const sc: { color: string }[] = cleanedValues.sliceColors || [];
          sliceColorsArray = sc.map((obj) => obj.color);
        }
        if (finalChartType === "bubble") {
          const bc: { color: string }[] = cleanedValues.bubbleColors || [];
          bubbleColorsArray = bc.map((obj) => obj.color);
        }
        if (finalChartType === "scatter" || finalChartType === "bubble") {
          cleanedValues.xAxisType = "linear";
        }
        const topLevelLabels =
          finalChartType !== "treemap"
            ? (cleanedValues.labels || "")
                .split(",")
                .map((label: string) => label.trim())
                .filter(Boolean)
            : [];
        updatedData = {
          title: cleanedValues.title,
          type: finalChartType,
          worksheetName: cleanedValues.worksheetName,
          associatedRange: cleanedValues.associatedRange,
          ...(finalChartType !== "treemap" && { labels: topLevelLabels }),
          labels: (cleanedValues.labels || "")
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean),
          datasets: (cleanedValues.datasets || []).map((ds: any) => {
            if (ds.type === "scatter" || ds.type === "bubble") {
              const segments = ds.data
                .split(";")
                .map((s: string) => s.trim())
                .filter(Boolean);
              if (ds.type === "bubble") {
                const points = segments.map((seg: string) => {
                  const [x, y, r] = seg.split(",").map((v: string) => parseFloat(v.trim()));
                  return { x, y, r };
                });
                const backgroundColors = bubbleColorsArray;
                return {
                  label: ds.label,
                  type: ds.type,
                  data: points,
                  fill: false,
                  backgroundColor: backgroundColors,
                  borderColor: ds.borderColor || "#4caf50",
                  borderWidth: ds.borderWidth || 1,
                };
              } else {
                const points = segments.map((seg: string) => {
                  const [x, y] = seg.split(",").map((v: string) => parseFloat(v.trim()));
                  return { x, y };
                });
                return {
                  label: ds.label,
                  type: ds.type,
                  data: points,
                  fill: false,
                  backgroundColor: ds.backgroundColor || "#4caf50",
                  borderColor: ds.borderColor || "#4caf50",
                  borderWidth: ds.borderWidth || 1,
                };
              }
            } else if (ds.type === "boxplot") {
              let parsed: number[][] = [];
              const rawData = (ds.data || "").trim();
              try {
                if (rawData.startsWith("[")) {
                  parsed = JSON.parse(rawData);
                } else if (rawData) {
                  const rowStrings = rawData
                    .split(";")
                    .map((r: String) => r.trim())
                    .filter(Boolean);
                  parsed = rowStrings.map((rowStr: String) => {
                    return rowStr.split(",").map((v: String) => parseFloat(v.trim()));
                  });
                }
              } catch (e) {
                console.warn("BoxPlot data parse failed:", rawData, e);
              }
              return {
                label: ds.label,
                type: "boxplot",
                data: parsed,
                datalabels: { display: false },
                backgroundColor: ds.backgroundColor,
                borderColor: ds.borderColor,
                outlierColor: ds.outlierColor || getRandomColor(),
                medianColor: ds.medianColor || getRandomColor(),
                whiskerColor: ds.whiskerColor || getRandomColor(),
                borderWidth: ds.borderWidth || 1,
              };
            } else if (ds.type === "treemap") {
              const dsAny = ds as any;
              let treemapData: any[] = [];
              if (typeof dsAny.data === "string" && dsAny.data.trim()) {
                const lines = dsAny.data
                  .split("\n")
                  .map((l: any) => l.trim())
                  .filter(Boolean);
                treemapData = lines.map((line: string) => {
                  const [rawName, rawVal] = line.split(",").map((x: string) => x.trim());
                  return {
                    name: rawName || "Unnamed",
                    value: parseFloat(rawVal) || 0,
                  };
                });
              } else if (Array.isArray(dsAny.tree)) {
                treemapData = dsAny.tree.map((item: any) => ({
                  name: item.name || "Unnamed",
                  value: item.value || 0,
                }));
              }
              const userFormatter = dsAny.labels?.formatter ?? defaultTreemapFormatter;
              return {
                label: ds.label || "Treemap",
                type: "treemap",
                tree: treemapData,
                groups: ds.groups || [],
                key: ds.key || "value",
                spacing: ds.spacing || 1,
                backgroundColor: ds.backgroundColor || getRandomColor(),
                borderColor: ds.borderColor || "#333",
                borderWidth: ds.borderWidth || 1,
                plugins: {
                  datalabels: {
                    display: dsAny.plugins?.datalabels?.display ?? false,
                  },
                },
                labels: {
                  display: dsAny.labels?.display ?? true,
                  formatter: userFormatter,
                },
              };
            } else if (ds.type === "funnel") {
              const labels = (cleanedValues.labels || "")
                .split(",")
                .map((l: string) => l.trim())
                .filter(Boolean);
              const funnelValues = ds.data
                .split(",")
                .map((v: string) => parseFloat(v.trim()))
                .filter((v: number) => !isNaN(v));
              if (labels.length !== funnelValues.length) {
                message.error("The number of labels must match the number of data points for the funnel chart.");
                return null;
              }
              const fc: { color: string }[] = form.getFieldValue("funnelColors") || [];
              const funnelColors = fc.length ? fc.map((obj) => obj.color) : funnelValues.map(() => getRandomColor());
              return {
                label: ds.label,
                type: "funnel",
                data: funnelValues,
                backgroundColor: funnelColors,
                borderColor: ds.borderColor || "#4caf50",
                borderWidth: ds.borderWidth || 1,
                options: { plugins: { funnel: { percent: false } } },
              };
            } else {
              let parsedValues: number[] = [];
              if (typeof ds.data === "string") {
                parsedValues = ds.data.split(",").map((num: string) => Number(num.trim()));
              } else if (Array.isArray(ds.data)) {
                parsedValues = ds.data.map((n: any) => Number(n));
              } else {
                parsedValues = [Number(ds.data)];
              }
              const shouldFill = cleanedValues.chartType === "area" || ds.type === "area";
              let finalBg = ds.backgroundColor || "#4caf50";
              if (["pie", "doughnut", "polarArea"].includes(finalChartType) && sliceColorsArray.length) {
                finalBg = sliceColorsArray;
              }
              return {
                label: ds.label,
                data: parsedValues,
                type: ds.type,
                fill: shouldFill,
                backgroundColor: finalBg,
                borderColor: ds.borderColor || "#4caf50",
                borderWidth: ds.borderWidth || 1,
              };
            }
          }),
          titleAlignment: cleanedValues.titleAlignment || "left",
          scales: noAxisTypes.includes(finalChartType)
            ? {}
            : {
                x: {
                  type: cleanedValues.xAxisType || "category",
                  time: cleanedValues.xAxisType === "time" ? { parser: "M/D/YYYY", unit: "day" } : undefined,
                  title: {
                    display: !!cleanedValues.xAxisTitle,
                    text: cleanedValues.xAxisTitle || "",
                  },
                },
                y: {
                  type: cleanedValues.yAxisType || "linear",
                  title: {
                    display: !!cleanedValues.yAxisTitle,
                    text: cleanedValues.yAxisTitle || "",
                  },
                },
              },
          plugins: {
            legend: {
              display: cleanedValues.showLegend !== false,
              position: cleanedValues.legendPosition || "top",
            },
            datalabels: {
              display: cleanedValues.showDataLabels !== false,
              color: cleanedValues.dataLabelColor || "#000",
              font: {
                size: cleanedValues.dataLabelFontSize || 12,
              },
              formatter: (_value: any, context: any) => {
                switch (chartType) {
                  case "pie":
                  case "doughnut":
                  case "polarArea":
                    return context.label;
                  case "scatter":
                  case "bubble": {
                    const pt = context.raw;
                    if (!pt || typeof pt.x !== "number" || typeof pt.y !== "number") {
                      return "";
                    }
                    return `(${pt.x}, ${pt.y})`;
                  }
                  case "funnel":
                    return context.chart.data.labels[context.dataIndex];
                  case "treemap":
                    return "";
                  default:
                    return context.formattedValue;
                }
              },
            },
            zoom: {
              pan: {
                enabled: cleanedValues.enablePan || false,
                mode: "xy",
              },
              zoom: {
                wheel: {
                  enabled: cleanedValues.enableZoom || false,
                },
                pinch: {
                  enabled: cleanedValues.enableZoom || false,
                },
                mode: cleanedValues.zoomMode || "xy",
              },
            },
            tooltip: {
              enabled: cleanedValues.enableTooltips !== false,
            },
          },
          backgroundColor: cleanedValues.chartBackgroundColor || "#ffffff",
          gridLineColor: cleanedValues.gridLineColor || "rgba(0, 0, 0, 0.1)",
          locale: cleanedValues.locale || "en-US",
          dynamicUpdate: {
            enabled: cleanedValues.enableDynamicUpdates || false,
            interval: cleanedValues.updateInterval || 5,
          },
          ...(finalChartType === "boxplot" && { title: cleanedValues.title || "Box Plot" }),
        } as ChartData;
        break;
      }
      case "gantt": {
        const existing = widget.data as GanttWidgetData;
        const existingTasks = existing.tasks || [];
        const { arrowColor } = cleanedValues;
        const mergedTasks = existingTasks.map((oldTask) => {
          const updated = (cleanedValues.tasks || []).find((t: any) => t.id === oldTask.id);
          if (!updated) return oldTask;
          return {
            ...oldTask,
            name: updated.name,
            start: updated.start.format("YYYY-MM-DD"),
            end: updated.end.format("YYYY-MM-DD"),
            completed: updated.completed ? updated.completed.format("YYYY-MM-DD") : undefined,
            progress: updated.progress,
            dependencies: Array.isArray(updated.dependencies)
              ? updated.dependencies
              : (updated.dependencies || "").split(","),
            color: updated.color || oldTask.color,
            progressColor: updated.progressColor || oldTask.progressColor,
          };
        });
        const newTasks = (cleanedValues.tasks || [])
          .filter((t: any) => !existingTasks.some((old) => old.id === t.id))
          .map((t: any) => ({
            id: t.id,
            name: t.name,
            start: t.start.format("YYYY-MM-DD"),
            end: t.end.format("YYYY-MM-DD"),
            completed: t.completed ? t.completed.format("YYYY-MM-DD") : undefined,
            progress: t.progress,
            dependencies: Array.isArray(t.dependencies) ? t.dependencies : (t.dependencies || "").split(","),
            color: t.color || "#FF0000",
            progressColor: t.progressColor || "#00AABB",
          }));
        updatedData = {
          ...existing,
          tasks: [...mergedTasks, ...newTasks],
          title: cleanedValues.title,
          arrowColor,
        };
        break;
      }
      case "metric": {
        updatedData = {
          ...cleanedValues,
          displayName: cleanedValues.displayName || "Metric",
          titleAlignment: cleanedValues.titleAlignment || "left",
          worksheetName: cleanedValues.worksheetName,
          cellAddress: cleanedValues.cellAddress,
        };
        break;
      }
      default:
        updatedData = {};
    }
    updatedData.zIndex = values.zIndex;
    onSubmit(updatedData);
  };
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
  const loadDataForNewChartType = async (mainType: string, data: any[][], form: any) => {
    switch (mainType) {
      case "boxplot": {
        if (data.length < 1) {
          message.error("Box Plot data must include at least a header row, and one data row.");
          return;
        }
        const boxLabels: string[] = [];
        const boxValues: number[][] = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const sampleName = String(row[0]) || "Sample";
          const q1 = Number(row[1]);
          const median = Number(row[2]);
          const q3 = Number(row[3]);
          const min = Number(row[4]);
          const max = Number(row[5]);
          if (isNaN(q1) || isNaN(median) || isNaN(q3) || isNaN(min) || isNaN(max)) {
            message.error(`Invalid data in row ${i + 1}. All boxplot values must be numbers.`);
            return;
          }
          boxLabels.push(sampleName);
          boxValues.push([min, q1, median, q3, max]);
        }
        const dataJson = JSON.stringify(boxValues);
        form.setFieldsValue({
          labels: boxLabels.join(", "),
          datasets: [
            {
              label: "BoxPlot Series",
              type: "boxplot",
              data: dataJson,
              backgroundColor: getRandomColor(),
              borderColor: getRandomColor(),
              borderWidth: 1,
            },
          ],
        });
        message.success("Box Plot data loaded successfully!");
        break;
      }
      case "treemap": {
        if (data.length < 2) {
          message.error("Treemap requires 2+ rows: header + data.");
          return;
        }
        const headerRow = data[0];
        const labelStr = headerRow.join(",");
        const rawRows = data.slice(1);
        const treeItems = rawRows.map((row, rowIndex) => {
          const [rawName, rawValue] = row;
          const name = String(rawName || `Item ${rowIndex + 1}`).trim();
          const value = parseFloat(String(rawValue).trim()) || 0;
          return { name, value };
        });
        const singleTreemapDataset = {
          label: "Treemap Data",
          type: "treemap",
          tree: treeItems,
          key: "value",
          groups: [],
          backgroundColor: treeItems.map(() => getRandomColor()),
          borderColor: "#333",
          borderWidth: 1,
        };
        form.setFieldsValue({
          labels: labelStr,
          datasets: [singleTreemapDataset],
          treemapColors: [],
        });
        message.success("Treemap data loaded from Excel, each line is its own dataset.");
        break;
      }
      case "funnel": {
        if (data.length < 2) {
          message.error("Funnel requires at least 2 rows of data.");
          return;
        }
        const rawRows = data.slice(1);
        const labels = rawRows.map((row) => row[0]);
        const values = rawRows.map((row) => Number(row[1]));
        form.setFieldsValue({
          labels: labels.join(", "),
          datasets: [
            {
              label: "Funnel",
              type: "funnel",
              data: values.join(", "),
              backgroundColor: getRandomColor(),
              borderColor: getRandomColor(),
              borderWidth: 1,
            },
          ],
        });
        message.success("Funnel data loaded from Excel.");
        break;
      }
      default:
        message.info(`No import logic for chart type: ${mainType}`);
    }
  };
  const handleLoadFromExcel = async () => {
    if (isPresenterMode) {
      message.warning("Loading data from Excel is not available in full-screen mode.");
      return;
    }
    try {
      const mainType = form.getFieldValue("chartType");
      await Excel.run(async (context) => {
        const range = context.workbook.getSelectedRange();
        // eslint-disable-next-line office-addins/no-navigational-load
        range.load(["address", "worksheet"]);
        await context.sync();
        const worksheetName = range.worksheet.name;
        const associatedRange = range.address.replace(/^.*!/, "");
        form.setFieldsValue({
          worksheetName,
          associatedRange,
        });
        const worksheet = context.workbook.worksheets.getItem(worksheetName);
        const dataRange = worksheet.getRange(associatedRange);
        dataRange.load("values");
        await context.sync();
        const data = dataRange.values;
        console.log(`Loaded data for chartType="${mainType}":`, data);
        if (["bar", "line", "pie", "doughnut", "radar", "polarArea"].includes(mainType)) {
          if (data.length < 2) {
            message.error("Selected range must have at least 2 rows (header + data).");
            return;
          }
          const labels = data[0].slice(1);
          const isPieDoughnutPolar = ["pie", "doughnut", "polarArea"].includes(mainType);
          const datasets = data.slice(1).map((row: any[]) => {
            const sliceColors = labels.map(() => getRandomColor());
            return {
              label: row[0],
              data: row.slice(1).join(", "),
              type: mainType,
              backgroundColor: isPieDoughnutPolar ? sliceColors : getRandomColor(),
              borderColor: getRandomColor(),
              borderWidth: 1,
            };
          });
          form.setFieldsValue({
            labels: labels.join(", "),
            datasets,
          });
          message.success(`${mainType} data loaded from Excel.`);
        } else if (mainType === "scatter") {
          if (data.length < 3) {
            message.error("Scatter requires 3 rows: header, X row, Y row.");
            return;
          }
          const xRow = data[1];
          const yRow = data[2];
          const xVals = xRow.slice(1).map((v: any) => Number(v));
          const yVals = yRow.slice(1).map((v: any) => Number(v));
          if (xVals.length !== yVals.length) {
            message.error("X row and Y row must have same # of points.");
            return;
          }
          const dataString = xVals.map((x: number, idx: number) => `${x},${yVals[idx]}`).join(";");
          form.setFieldsValue({
            labels: "",
            datasets: [
              {
                label: "Scatter Series",
                data: dataString,
                type: "scatter",
                backgroundColor: getRandomColor(),
                borderColor: getRandomColor(),
                borderWidth: 1,
              },
            ],
          });
          message.success("Scatter data loaded from Excel.");
        } else if (mainType === "bubble") {
          if (data.length < 4) {
            message.error("Bubble requires 4 rows: header, X row, Y row, R row.");
            return;
          }
          const xRow = data[1];
          const yRow = data[2];
          const rRow = data[3];
          const xVals = xRow.slice(1).map((v: any) => Number(v));
          const yVals = yRow.slice(1).map((v: any) => Number(v));
          const rVals = rRow.slice(1).map((v: any) => Number(v));
          if (xVals.length !== yVals.length || yVals.length !== rVals.length) {
            message.error("X, Y, R must have same # of points.");
            return;
          }
          const headerRow = data[0].slice(1);
          const labelsStr = headerRow.join(", ");
          const points = xVals.map((x: number, idx: number) => ({
            x,
            y: yVals[idx],
            r: rVals[idx],
          }));
          const dataString = points
            .map((pt: { x: number; y: number; r: number }) => `${pt.x},${pt.y},${pt.r}`)
            .join(";");
          form.setFieldsValue({
            labels: labelsStr,
            datasets: [
              {
                label: "Bubble Series",
                data: dataString,
                type: "bubble",
                backgroundColor: getRandomColor(),
                borderColor: getRandomColor(),
                borderWidth: 1,
              },
            ],
          });
          message.success("Bubble data loaded from Excel.");
        } else {
          await loadDataForNewChartType(mainType, data, form);
        }
      });
    } catch (err) {
      console.error("Error loading Excel data:", err);
      message.error("Failed to load data from Excel.");
    }
  };
  useEffect(() => {
    const rawLabels = form.getFieldValue("labels") || "";
    const labelArr = rawLabels
      .split(",")
      .map((l: any) => l.trim())
      .filter(Boolean);
    const currentSliceColors = form.getFieldValue("sliceColors") || [];
    if (currentSliceColors.length !== labelArr.length) {
      const updated = labelArr.map((_: any, idx: any) => currentSliceColors[idx] || getRandomColor());
      form.setFieldsValue({ sliceColors: updated });
    }
  }, [form, form.getFieldValue("labels")]);
  useEffect(() => {
    if (chartType === "bubble") {
      const dataSets = form.getFieldValue("datasets") || [];
      const bubbleDS = dataSets.find((ds: any) => ds.type === "bubble");
      if (!bubbleDS) return;
      if (typeof bubbleDS.data === "string") {
        const segments = bubbleDS.data
          .split(";")
          .map((s: string) => s.trim())
          .filter(Boolean);
        const neededCount = segments.length;
        const currentBubbleColors = form.getFieldValue("bubbleColors") || [];
        if (currentBubbleColors.length !== neededCount) {
          const updated = [...currentBubbleColors];
          while (updated.length < neededCount) {
            updated.push({ color: getRandomColor() });
          }
          if (updated.length > neededCount) {
            updated.splice(neededCount);
          }
          form.setFieldsValue({ bubbleColors: updated });
        }
      }
    }
  }, [chartType, form, form.getFieldValue("datasets")]);
  useEffect(() => {
    if (chartType === "boxplot") {
      const dataSets = form.getFieldValue("datasets") || [];
      const boxplotDS = dataSets[0];
      if (!boxplotDS || boxplotDS.type !== "boxplot") return;
      const labelStr = form.getFieldValue("labels") || "";
      const labelArr = labelStr
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      const currentColors = form.getFieldValue(["datasets", 0, "boxplotSampleColors"]) || [];
      if (currentColors.length !== labelArr.length) {
        const updated = [...currentColors];
        while (updated.length < labelArr.length) {
          updated.push({ color: "#000000" });
        }
        if (updated.length > labelArr.length) {
          updated.splice(labelArr.length);
        }
        form.setFieldsValue({
          datasets: [
            {
              ...boxplotDS,
              boxplotSampleColors: updated,
            },
            ...dataSets.slice(1),
          ],
        });
      }
    }
  }, [chartType]);
  return (
    <Form form={form} layout="vertical" initialValues={getInitialValues()} onFinish={handleFinish}>
      {widget.type === "text" && (
        <>
          <Form.Item name="content" label="Content" rules={[{ required: true, message: "Please enter content" }]}>
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
      {widget.type === "title" && (
        <>
          <Form.Item
            name="content"
            label="Title Text"
            rules={[{ required: true, message: "Please enter the title text" }]}
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
      {widget.type === "chart" && (
        <>
          <Form.Item name="title" label="Chart Title" rules={[{ required: true, message: "Please enter chart title" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="chartType"
            label="Chart Type"
            rules={[{ required: true, message: "Please select chart type" }]}
          >
            <Select
              onChange={(value: string) => {
                setChartType(value);
                const currentDatasets = form.getFieldValue("datasets") || [];
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
              <Option value="boxplot">Box Plot</Option>
              <Option value="funnel">Funnel</Option>
              <Option value="treemap">Treemap</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="labels"
            label="Labels (comma-separated)"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const cType = getFieldValue("chartType");
                  if (["scatter", "bubble"].includes(cType)) {
                    return Promise.resolve();
                  }
                  if (!value || !value.trim()) {
                    return Promise.reject(new Error("Please enter labels (header row)."));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input />
          </Form.Item>
          {["pie", "doughnut", "polarArea"].includes(chartType) && (
            <Form.List name="sliceColors">
              {(fields) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => {
                    const rawLabels = form.getFieldValue("labels") || "";
                    const labelArr = rawLabels
                      .split(",")
                      .map((l: string) => l.trim())
                      .filter(Boolean);
                    const sliceLabel = labelArr[index] || `Slice #${index + 1}`;
                    return (
                      <Form.Item
                        {...restField}
                        key={key}
                        label={`Color for ${sliceLabel}`}
                        name={[name, "color"]}
                        rules={[{ required: true, message: "Please pick a color" }]}
                      >
                        <Input type="color" />
                      </Form.Item>
                    );
                  })}
                </>
              )}
            </Form.List>
          )}
          {chartType === "funnel" && (
            <Collapse>
              <Collapse.Panel header="Funnel Colors" key="funnelColors">
                <Form.List name="funnelColors">
                  {(fields) => {
                    const rawLabels = form.getFieldValue("labels") || "";
                    const labelArr = rawLabels
                      .split(",")
                      .map((l: string) => l.trim())
                      .filter(Boolean);
                    return (
                      <>
                        {fields.map(({ key, name, ...restField }, index) => {
                          const funnelLabel = labelArr[index] || `Segment #${index + 1}`;
                          return (
                            <Form.Item
                              {...restField}
                              key={key}
                              name={[name, "color"]}
                              label={`Color for ${funnelLabel}`}
                              rules={[{ required: true, message: "Please pick a color" }]}
                            >
                              <Input type="color" />
                            </Form.Item>
                          );
                        })}
                      </>
                    );
                  }}
                </Form.List>
              </Collapse.Panel>
            </Collapse>
          )}
          <Form.Item
            name="worksheetName"
            label="Worksheet"
            rules={[{ required: true, message: "Please select a worksheet" }]}
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
              { required: true, message: "Please enter a data range" },
              {
                pattern: /^[A-Za-z]{1,3}[1-9][0-9]{0,6}:[A-Za-z]{1,3}[1-9][0-9]{0,6}$/,
                message: "Please enter a valid range (e.g., A1:B10)",
              },
            ]}
          >
            <Input placeholder="e.g., A1:B10" />
          </Form.Item>
          {!isPresenterMode && (
            <Form.Item>
              <Button type="primary" icon={<SelectOutlined />} onClick={handleLoadFromExcel}>
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
                      borderBottom: "1px solid #eee",
                      paddingBottom: 16,
                    }}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "label"]}
                      label="Dataset Label"
                      rules={[
                        {
                          required: true,
                          message: "Please enter dataset label",
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "type"]}
                      label="Dataset Chart Type"
                      initialValue="line"
                      rules={[
                        {
                          required: true,
                          message: "Please select chart type for this dataset",
                        },
                      ]}
                    >
                      <Select disabled={["pie", "doughnut", "polarArea"].includes(chartType)}>
                        <Option value="bar">Bar</Option>
                        <Option value="line">Line</Option>
                        <Option value="pie">Pie</Option>
                        <Option value="doughnut">Doughnut</Option>
                        <Option value="radar">Radar</Option>
                        <Option value="polarArea">Polar Area</Option>
                        <Option value="bubble">Bubble</Option>
                        <Option value="scatter">Scatter</Option>
                        <Option value="boxplot">Box Plot</Option>
                        <Option value="funnel">Funnel</Option>
                        <Option value="treemap">Treemap</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.datasets?.[name]?.type !== currentValues.datasets?.[name]?.type
                      }
                      noStyle
                    >
                      {() => {
                        const dsType = form.getFieldValue(["datasets", name, "type"]);
                        if (dsType === "treemap") {
                          return (
                            <>
                              <Form.List name={[name, "tree"]}>
                                {(dataFields, { add: addData, remove: removeData }) => (
                                  <>
                                    {dataFields.map(({ key: dataKey, name: dataName, ...dataRestField }) => (
                                      <Space
                                        key={dataKey}
                                        style={{ display: "flex", marginBottom: 8 }}
                                        align="baseline"
                                      >
                                        <Form.Item
                                          {...dataRestField}
                                          name={[dataName, "name"]}
                                          rules={[{ required: true, message: "Missing label" }]}
                                        >
                                          <Input placeholder="Name" />
                                        </Form.Item>
                                        <Form.Item
                                          {...dataRestField}
                                          name={[dataName, "value"]}
                                          rules={[
                                            { required: true, message: "Missing value" },
                                            {
                                              type: "number",
                                              message: "Value must be a number",
                                            },
                                          ]}
                                        >
                                          <InputNumber placeholder="Value" />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => removeData(dataName)} />
                                      </Space>
                                    ))}
                                    <Form.Item>
                                      <Button type="dashed" onClick={() => addData()} block icon={<PlusOutlined />}>
                                        Add Data Point
                                      </Button>
                                    </Form.Item>
                                  </>
                                )}
                              </Form.List>
                              <Form.Item
                                {...restField}
                                name={[name, "plugins", "datalabels", "display"]}
                                valuePropName="checked"
                                label="Treemap DataLabels?"
                              >
                                <Switch />
                              </Form.Item>
                            </>
                          );
                        } else if (dsType === "boxplot") {
                          return (
                            <>
                              <Form.Item {...restField} name={[name, "data"]} label="BoxPlot Data (JSON or CSV)">
                                <TextArea rows={2} />
                              </Form.Item>
                              <Form.Item {...restField} name={[name, "outlierColor"]} label="Outlier Color">
                                <Input type="color" />
                              </Form.Item>
                              <Form.Item {...restField} name={[name, "medianColor"]} label="Median Color">
                                <Input type="color" />
                              </Form.Item>
                              <Form.Item {...restField} name={[name, "whiskerColor"]} label="Whisker Color">
                                <Input type="color" />
                              </Form.Item>
                            </>
                          );
                        } else {
                          return (
                            <Form.Item
                              {...restField}
                              name={[name, "data"]}
                              label="Data Points"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter data points",
                                },
                                {
                                  validator: (_, value) => {
                                    const dsType = form.getFieldValue(["datasets", name, "type"]);
                                    if (!value) return Promise.resolve();
                                    if (dsType === "bubble") {
                                      const segments = value
                                        .split(";")
                                        .map((s: string) => s.trim())
                                        .filter(Boolean);
                                      for (let seg of segments) {
                                        const parts = seg.split(",").map((v: string) => v.trim());
                                        if (parts.length !== 3 || parts.some((p: string) => isNaN(Number(p)))) {
                                          return Promise.reject(
                                            new Error("Bubble data must be x,y,r triplets, separated by semicolons.")
                                          );
                                        }
                                      }
                                    } else if (dsType === "scatter") {
                                      const segments = value
                                        .split(";")
                                        .map((s: string) => s.trim())
                                        .filter(Boolean);
                                      for (let seg of segments) {
                                        const parts = seg.split(",").map((v: string) => v.trim());
                                        if (parts.length !== 2 || parts.some((p: string) => isNaN(Number(p)))) {
                                          return Promise.reject(
                                            new Error("Scatter data must be x,y pairs, separated by semicolons.")
                                          );
                                        }
                                      }
                                    }
                                    return Promise.resolve();
                                  },
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                          );
                        }
                      }}
                    </Form.Item>
                    {!["pie", "doughnut", "polarArea", "bubble", "funnel"].includes(chartType) && (
                      <Form.Item
                        {...restField}
                        name={[name, "backgroundColor"]}
                        label="Background Color"
                        rules={[
                          {
                            required: true,
                            message: "Please pick a background color",
                          },
                        ]}
                      >
                        <Input type="color" />
                      </Form.Item>
                    )}
                    <Form.Item
                      {...restField}
                      name={[name, "borderColor"]}
                      label="Border Color"
                      rules={[
                        {
                          required: true,
                          message: "Please pick a border color",
                        },
                      ]}
                    >
                      <Input type="color" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "borderWidth"]}
                      label="Border Width"
                      rules={[
                        {
                          required: true,
                          message: "Please enter border width",
                        },
                      ]}
                    >
                      <InputNumber min={0} />
                    </Form.Item>
                    {!["pie", "doughnut", "polarArea"].includes(chartType) && (
                      <Button
                        type="dashed"
                        onClick={() => remove(name)}
                        icon={<MinusCircleOutlined />}
                        style={{ marginTop: 8 }}
                      >
                        Remove Dataset
                      </Button>
                    )}
                  </div>
                ))}
                {!["pie", "doughnut", "polarArea"].includes(chartType) && (
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() =>
                        add({
                          label: "",
                          type: "bar",
                          data: "",
                          backgroundColor: "#4caf50",
                          borderColor: "#4caf50",
                          borderWidth: 1,
                        })
                      }
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Dataset
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>
          {chartType === "boxplot" && (
            <Form.List name="boxplotSampleColors">
              {(fields) => {
                const labelStr = form.getFieldValue("labels") || "";
                const labelArr = labelStr
                  .split(",")
                  .map((s: String) => s.trim())
                  .filter(Boolean);
                return (
                  <>
                    {fields.map(({ key, name, ...restField }, index) => {
                      const sampleLabel = labelArr[index] || `Sample #${index + 1}`;
                      return (
                        <Form.Item
                          {...restField}
                          key={key}
                          name={[name, "color"]}
                          label={`Color for ${sampleLabel}`}
                          rules={[{ required: true, message: "Please pick a color" }]}
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
          {chartType === "bubble" && (
            <Collapse>
              <Collapse.Panel header="Bubble Colors" key="bubbleColors">
                <Form.List name="bubbleColors">
                  {(fields) => (
                    <>
                      {fields.map(({ key, name, ...restField }, index) => (
                        <Form.Item
                          {...restField}
                          key={key}
                          name={[name, "color"]}
                          label={`Color for Bubble #${index + 1}`}
                          rules={[{ required: true, message: "Please pick a color" }]}
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
            {!["pie", "doughnut", "polarArea", "radar", "funnel", "treemap"].includes(chartType) && (
              <>
                <Panel header="Axis Settings" key="axis">
                  <Form.Item label="X-Axis Type" name="xAxisType">
                    <Select>
                      <Option value="category">Category</Option>
                      <Option value="linear">Linear</Option>
                      <Option value="logarithmic">Logarithmic</Option>
                      <Option value="time">Time</Option>
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
                  <Form.Item label="Enable Zoom" name="enableZoom" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item label="Enable Pan" name="enablePan" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item label="Zoom Mode" name="zoomMode">
                    <Select>
                      <Option value="x">X</Option>
                      <Option value="y">Y</Option>
                      <Option value="xy">XY</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Enable Tooltips" name="enableTooltips" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item label="Tooltip Template" name="tooltipTemplate">
                    <TextArea placeholder="Use {label} and {value} placeholders" rows={2} />
                  </Form.Item>
                </Panel>
                <Panel header="Styling" key="styling">
                  {!["pie", "doughnut", "polarArea", "bubble", "funnel"].includes(chartType) && (
                    <Form.Item label="Chart Background Color" name="chartBackgroundColor">
                      <Input type="color" />
                    </Form.Item>
                  )}
                  <Form.Item label="Grid Line Color" name="gridLineColor">
                    <Input type="color" />
                  </Form.Item>
                </Panel>
              </>
            )}
            <Panel header="Legend" key="legend">
              <Form.Item label="Show Legend" name="showLegend" valuePropName="checked">
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
              {chartType !== "treemap" && (
                <>
                  <Form.Item label="Show Data Labels" name="showDataLabels" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item label="Data Label Color" name="dataLabelColor">
                    <Input type="color" />
                  </Form.Item>
                  <Form.Item label="Data Label Font Size" name="dataLabelFontSize">
                    <InputNumber min={8} max={24} />
                  </Form.Item>
                </>
              )}
            </Panel>
          </Collapse>
          <Form.Item name="titleAlignment" label="Title Alignment">
            <Select>
              <Option value="left">Left</Option>
              <Option value="center">Center</Option>
            </Select>
          </Form.Item>
        </>
      )}
      {widget.type === "gantt" && (
        <>
          <Form.Item
            name="title"
            label="Gantt Chart Title"
            rules={[{ required: true, message: "Please enter Gantt chart title" }]}
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
                      borderBottom: "1px solid #eee",
                      paddingBottom: 16,
                    }}
                  >
                    <Form.Item {...restField} name={[name, "id"]} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "name"]} label="Task Name" tooltip="Non-editable">
                      <Input disabled />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "color"]}
                      label="Task Color"
                      rules={[{ required: true, message: "Please pick a task color" }]}
                    >
                      <Input type="color" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "progressColor"]}
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
      {widget.type === "metric" && (
        <>
          <Form.Item
            name="worksheetName"
            label="Worksheet"
            rules={[{ required: true, message: "Please select a worksheet" }]}
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
              { required: true, message: "Please select a cell" },
              {
                pattern: /^[A-Za-z]{1,3}[1-9][0-9]{0,6}$/,
                message: "Please enter a valid cell address (e.g., E8)",
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
                  Office.context.ui.messageParent(JSON.stringify({ type: "selectCell", widgetId }));
                } else {
                  try {
                    await Excel.run(async (context) => {
                      const rng = context.workbook.getSelectedRange();
                      // eslint-disable-next-line office-addins/no-navigational-load
                      rng.load(["address", "worksheet"]);
                      await context.sync();
                      const selectedSheet = rng.worksheet;
                      selectedSheet.load("name");
                      await context.sync();
                      const sheetName = selectedSheet.name;
                      const address = rng.address.includes("!") ? rng.address.split("!")[1] : rng.address;
                      form.setFieldsValue({
                        cellAddress: address,
                        worksheetName: sheetName,
                      });
                    });
                  } catch (err) {
                    console.error("Error selecting cell:", err);
                    message.error("Failed to select cell from Excel.");
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
            rules={[{ required: true, message: "Please select a display format" }]}
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
            rules={[{ required: true, message: "Please enter a target value" }]}
          >
            <InputNumber placeholder="Enter target" />
          </Form.Item>
          <Form.Item
            name="comparison"
            label="Comparison Type"
            rules={[{ required: true, message: "Please select a comparison type" }]}
          >
            <Select placeholder="Select comparison type">
              <Option value="greater">Greater or Equal</Option>
              <Option value="less">Less or Equal</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="fontSize"
            label="Font Size"
            rules={[{ required: true, message: "Please enter a font size" }]}
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
      {renderZIndexControls()}
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
