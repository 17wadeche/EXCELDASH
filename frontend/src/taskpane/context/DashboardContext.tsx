/* eslint-disable office-addins/call-sync-before-read */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable office-addins/load-object-before-read */
/* eslint-disable office-addins/no-navigational-load */
/* eslint-disable office-addins/no-context-sync-in-loop */
/* eslint-disable no-undef */
/// <reference types="office-js" />
// src/taskpane/context/DashboardContext.tsx
import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import {
  Widget,
  TextData,
  ChartData,
  GanttWidgetData,
  ImageWidgetData,
  TitleWidgetData,
  TableData,
  DashboardVersion,
  GridLayoutItem,
  DashboardItem,
  LineWidgetData,
  MetricData,
  Task,
  TableWidget,
  TemplateItem,
} from "../components/types";
import { v4 as uuidv4 } from "uuid";
import { Breakpoint, GRID_COLS, WIDGET_SIZES } from "../components/layoutConstants";
import { message } from "antd";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";
import PromptWidgetDetailsModal from "../components/PromptWidgetDetailsModal";
import { DashboardBorderSettings } from "../components/types";
import { deleteDashboardById, createTemplate, updateTemplate } from "../utils/api";
import { getWorkbookIdFromProperties, isInDialog } from "../utils/excelUtils";
import SelectTableModal from "../components/SelectTableModal";
import "chartjs-chart-box-and-violin-plot";
interface DashboardContextProps {
  widgets: Widget[];
  dashboards: DashboardItem[];
  addWidget: (type: "title" | "text" | "chart" | "gantt" | "image" | "metric" | "table" | "line", data?: any) => void;
  removeWidget: (id: string) => void;
  updateWidget: (
    id: string,
    updatedData: Partial<
      | TitleWidgetData
      | TextData
      | ChartData
      | GanttWidgetData
      | ImageWidgetData
      | TableData
      | MetricData
      | LineWidgetData
    >
  ) => void;
  copyWidget: (widget: Widget) => void;
  importChartImageFromExcel: () => void;
  readDataFromExcel: () => void;
  readGanttDataFromExcel: () => void;
  selectedRangeAddress: string | null;
  setSelectedRangeAddress: (address: string | null) => void;
  generateProjectManagementTemplateAndGanttChart: () => void;
  insertProjectManagementTemplate: () => void;
  saveAsTemplate: () => void;
  isFullscreenActive: boolean;
  setIsFullscreenActive: React.Dispatch<React.SetStateAction<boolean>>;
  currentDashboardId: string | null;
  setCurrentDashboardId: (id: string | null) => void;
  userEmail: string;
  setUserEmail: React.Dispatch<React.SetStateAction<string>>;
  setCurrentWorkbookId: React.Dispatch<React.SetStateAction<string>>;
  currentDashboard: DashboardItem | null;
  addTaskToGantt: (task: Task) => Promise<void>;
  setCurrentDashboard: (dashboard: DashboardItem | null) => void;
  updateLayoutsForNewWidgets: (widgets: Widget[]) => void;
  currentWorkbookId: string;
  exportDashboardAsPDF: () => Promise<void>;
  emailDashboard: () => void;
  dashboardTitle: string;
  setDashboardTitle: (title: string) => void;
  availableWorksheets: string[];
  setAvailableWorksheets: React.Dispatch<React.SetStateAction<string[]>>;
  setWidgets: React.Dispatch<React.SetStateAction<Widget[]>>;
  saveDashboardVersion: () => void;
  refreshTableWidgetData: (widgetId: string) => Promise<void>;
  restoreDashboardVersion: (versionId: string) => void;
  getWorkbookIdFromProperties: () => Promise<string>;
  promptForWidgetDetails: (widget: Widget, onComplete: (updatedWidget: Widget) => void) => void;
  getAvailableTables: () => Promise<{ name: string; sheetName: string; rangeAddress: string }[]>;
  editDashboard: (dashboard: DashboardItem) => Promise<void>;
  deleteDashboard: (id: string) => void;
  undo: () => void;
  redo: () => void;
  layouts: { [key: string]: GridLayoutItem[] };
  setLayouts: React.Dispatch<React.SetStateAction<{ [key: string]: GridLayoutItem[] }>>;
  canUndo: boolean;
  canRedo: boolean;
  writeMetricValue: (id: string, newValue: number, worksheetName: string, cellAddress: string) => Promise<void>;
  currentTemplateId: string | null;
  setCurrentTemplateId: (id: string | null) => void;
  setDashboards: React.Dispatch<React.SetStateAction<DashboardItem[]>>;
  applyDataValidation: () => void;
  updateDashboardTitle: (id: string, newTitle: string) => void;
  dashboardBorderSettings: DashboardBorderSettings;
  setDashboardBorderSettings: React.Dispatch<React.SetStateAction<DashboardBorderSettings>>;
  refreshAllCharts: () => void;
  isFetching: boolean;
  setIsFetching: (loading: boolean) => void;
}
interface DashboardProviderProps {
  children: React.ReactNode;
  initialWidgets?: Widget[];
  initialLayouts?: { [key: string]: GridLayoutItem[] };
  initialWorkbookId?: string | null;
  initialAvailableWorksheets?: string[];
}
export const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);
export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
  initialWidgets = [],
  initialLayouts = {},
  initialAvailableWorksheets = [],
}) => {
  const defaultTitleWidget: Widget = {
    id: "dashboard-title",
    type: "title",
    data: {
      content: "Your Dashboard Title",
      fontSize: 24,
      textColor: "#000000",
      backgroundColor: "#ffffff",
      titleAlignment: "center",
    } as TitleWidgetData,
  };
  const [widgets, setWidgetsState] = useState<Widget[]>(
    initialWidgets && initialWidgets.length > 0 ? initialWidgets : [defaultTitleWidget]
  );
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [dashboardTitle, setDashboardTitle] = useState<string>("My Dashboard");
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState<DashboardItem | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [widgetToPrompt, setWidgetToPrompt] = useState<{
    widget: Widget;
    onComplete: (updatedWidget: Widget) => void;
  } | null>(null);
  const [layouts, setLayouts] = useState<{ [key: string]: GridLayoutItem[] }>(initialLayouts);
  const [currentWorkbookId, setCurrentWorkbookId] = useState<string>("");
  const [pastStates, setPastStates] = useState<{ widgets: Widget[]; layouts: { [key: string]: GridLayoutItem[] } }[]>(
    []
  );
  const [futureStates, setFutureStates] = useState<
    { widgets: Widget[]; layouts: { [key: string]: GridLayoutItem[] } }[]
  >([]);
  const [availableWorksheets, setAvailableWorksheets] = useState<string[]>([]);
  const ganttEventHandlersRef = useRef<((event: Excel.WorksheetChangedEventArgs) => Promise<void>)[]>([]);
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(null);
  const [selectedRangeAddress, setSelectedRangeAddress] = useState<string | null>(null);
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;
  const isUndoRedoRef = useRef(false);
  const [pendingWidget, setPendingWidget] = useState<Widget | undefined>(undefined);
  const [isSelectTableModalVisible, setIsSelectTableModalVisible] = useState(false);
  const isGanttHandlerRegistered = useRef(false);
  const isReadGanttDataInProgress = useRef(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [dashboardBorderSettings, setDashboardBorderSettings] = useState<DashboardBorderSettings>({
    showBorder: false,
    color: "#000000",
    thickness: 1,
    style: "solid",
    backgroundColor: "#ffffff",
    width: 730,
  });
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const fetchUserEmail = async () => {
    try {
      const storedEmail = localStorage.getItem("userEmail");
      if (storedEmail) {
        setUserEmail(storedEmail);
      } else {
        console.warn("User email not found in localStorage.");
        setUserEmail("");
      }
    } catch (error) {
      console.error("Error fetching user email:", error);
      message.error("Failed to retrieve user email.");
    }
  };
  useEffect(() => {
    fetchUserEmail();
  }, []);
  useEffect(() => {
    if (currentDashboardId) {
      console.log(`[DashboardProvider] currentDashboardId changed: ${currentDashboardId}`);
    } else {
      console.log("[DashboardProvider] currentDashboardId is null");
    }
  }, [currentDashboardId]);
  useEffect(() => {
    if (currentWorkbookId) {
      console.log(`[DashboardProvider] currentWorkbookId changed: ${currentWorkbookId}`);
    } else {
      console.log("[DashboardProvider] currentWorkbookId is empty");
    }
  }, [currentWorkbookId]);
  const setWidgets: React.Dispatch<React.SetStateAction<Widget[]>> = (update) => {
    if (typeof update === "function") {
      setWidgetsState((prevWidgets) => {
        const newWidgets = (update as (prev: Widget[]) => Widget[])(prevWidgets);
        return newWidgets;
      });
    } else {
      setWidgetsState(update);
    }
  };
  useEffect(() => {
    if (!currentDashboardId || !currentWorkbookId || dashboardLoaded) return;
    const loadCurrentDashboard = async () => {
      if (currentDashboard) return;
      try {
        const response = await axios.get(`/api/dashboards/${currentDashboardId}`);
        const db: DashboardItem = response.data;
        setCurrentDashboard(db);
        if (db.borderSettings) {
          setDashboardBorderSettings(db.borderSettings);
        } else {
          setDashboardBorderSettings({
            showBorder: false,
            color: "#000000",
            thickness: 1,
            style: "solid",
          });
        }
        let updatedWidgets = db.components || [];
        if (!updatedWidgets.some((w) => w.type === "title")) {
          updatedWidgets = [defaultTitleWidget, ...updatedWidgets];
        }
        setWidgetsState(updatedWidgets);
        setDashboardTitle(db.title || "My Dashboard");
        if (db.layouts && Object.keys(db.layouts).length > 0) {
          setLayouts(db.layouts);
        } else {
          updateLayoutsForNewWidgets(updatedWidgets);
        }
        setDashboardLoaded(true);
      } catch (error) {
        console.error(`Error loading dashboard ${currentDashboardId}:`, error);
        message.error("Failed to load the selected dashboard.");
      }
    };
    if (!currentDashboard) {
      loadCurrentDashboard();
    }
  }, [currentDashboardId, currentWorkbookId, currentDashboard, dashboardLoaded]);
  const updateWidgetsWithHistory = (updateFn: (prevWidgets: Widget[]) => Widget[]) => {
    console.log("updateWidgetsWithHistory: Initiating widget update with history.");
    setWidgetsState((prevWidgets: Widget[]) => {
      const newWidgets = updateFn(prevWidgets);
      console.log("updateWidgetsWithHistory: New widgets after update:", newWidgets);
      setPastStates((prev) => [...prev, { widgets: prevWidgets, layouts }]);
      console.log("updateWidgetsWithHistory: Past states updated.");
      setFutureStates([]);
      console.log("updateWidgetsWithHistory: Future states cleared.");
      return newWidgets;
    });
  };
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
    }
  }, [widgets, layouts]);
  const writeMetricValue = async (
    widgetId: string,
    newValue: number,
    worksheetName: string,
    cellAddress: string
  ): Promise<void> => {
    try {
      console.log(`Updating widget ${widgetId} with new value ${newValue}`);
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheet = context.workbook.worksheets.getItemOrNullObject(worksheetName);
        sheet.load("name");
        await context.sync();
        if (sheet.isNullObject) {
          message.error(`Worksheet "${worksheetName}" not found.`);
          return;
        }
        const range = sheet.getRange(cellAddress);
        range.values = [[newValue]];
        await context.sync();
        console.log(`Setting widget ${widgetId} currentValue to ${newValue}`);
        setWidgets((prevWidgets: Widget[]) =>
          prevWidgets.map((widget: Widget) =>
            widget.id === widgetId && widget.type === "metric"
              ? {
                  ...widget,
                  data: {
                    ...widget.data,
                    currentValue: newValue,
                  } as MetricData,
                }
              : widget
          )
        );
        console.log(`Widget ${widgetId} updated successfully`);
        message.success("Metric value updated successfully!");
      });
    } catch (error: any) {
      console.error("Error writing metric value:", error);
    }
  };
  const promptForWidgetDetails = useCallback((widget: Widget, onComplete: (updatedWidget: Widget) => void) => {
    setWidgetToPrompt({ widget, onComplete });
  }, []);
  useEffect(() => {
    const fetchSheets = async () => {
      const sheets = await getAvailableWorksheets();
      setAvailableWorksheets(sheets);
    };
    if (!initialAvailableWorksheets.length) {
      fetchSheets();
    } else {
      setAvailableWorksheets(initialAvailableWorksheets);
    }
  }, [initialAvailableWorksheets]);

  useEffect(() => {
    if (!currentWorkbookId) {
      const initializeWorkbookId = async () => {
        const workbookId = (await getWorkbookIdFromProperties()).toLowerCase();
        console.log("Front-End: Retrieved Workbook ID from properties:", workbookId);
        setCurrentWorkbookId(workbookId);
      };
      initializeWorkbookId();
    }
  }, [currentWorkbookId]);
  useEffect(() => {
    if (currentDashboardId && dashboards.length > 0 && currentWorkbookId) {
      const foundDashboard = dashboards.find((d) => d.id === currentDashboardId);
      if (foundDashboard) {
        setCurrentDashboard(foundDashboard);
      }
    }
  }, [currentDashboardId, dashboards, currentWorkbookId]);
  const getAvailableWorksheets = async (): Promise<string[]> => {
    if (isInDialog()) {
      console.log("Running in dialog; skipping getAvailableWorksheets.");
      return [];
    }
    try {
      return await Excel.run(async (context: Excel.RequestContext) => {
        const sheets = context.workbook.worksheets;
        sheets.load("items/name");
        await context.sync();
        return sheets.items.map((sheet) => sheet.name);
      });
    } catch (error: any) {
      console.error("Error fetching worksheets:", error);
      return [];
    }
  };
  useEffect(() => {
    if (!currentDashboardId || !currentDashboard || dashboardLoaded) return;
    const migrateWidgets = async () => {
      try {
        const serverWidgets: Widget[] = currentDashboard.components || [];
        const needsMigration = serverWidgets.some(
          (widget: Widget) => (widget.type === "chart" || widget.type === "image") && "chartIndex" in widget.data
        );
        if (needsMigration) {
          await migrateChartIndexToAssociatedRange();
        } else {
          const updatedWidgets = serverWidgets
            .map((widget: any) => {
              switch (widget.type) {
                case "image": {
                  const imageData: ImageWidgetData = {
                    src: widget.data.src || "",
                  };
                  return { ...widget, data: imageData };
                }
                case "chart": {
                  const chartData: ChartData = {
                    type: widget.data.type || "bar",
                    title: widget.data.title || "Sample Chart",
                    labels: widget.data.labels || [],
                    datasets: widget.data.datasets || [],
                    titleAlignment: widget.data.titleAlignment || "left",
                    associatedRange: widget.data.associatedRange || "",
                    worksheetName: widget.data.worksheetName || "",
                  };
                  return { ...widget, data: chartData };
                }
                case "metric": {
                  const metricData: MetricData = {
                    cellAddress: widget.data.cellAddress || "",
                    worksheetName: widget.data.worksheetName || "",
                    targetValue: widget.data.targetValue ?? 0,
                    comparison: widget.data.comparison || "greater",
                    fontSize: widget.data.fontSize ?? 28,
                    displayName: widget.data.displayName || "KPI",
                    format: widget.data.format || "number",
                    currentValue: widget.data.currentValue ?? 0,
                    titleAlignment: widget.data.titleAlignment || "left",
                    backgroundColor: "#ffffff",
                    textColor: "#000000",
                  };
                  return { ...widget, data: metricData };
                }
                case "text": {
                  const textData: TextData = {
                    content: widget.data.content || "Your Dashboard Title",
                    fontSize: widget.data.fontSize ?? 24,
                    textColor: widget.data.textColor || "#000000",
                    backgroundColor: widget.data.backgroundColor || "#ffffff",
                    titleAlignment: widget.data.titleAlignment || "left",
                  };
                  return { ...widget, data: textData };
                }
                case "gantt": {
                  const ganttData: GanttWidgetData = {
                    tasks: widget.data.tasks || [],
                    title: widget.data.title || "Gantt Chart",
                    titleAlignment: widget.data.titleAlignment || "left",
                  };
                  return { ...widget, data: ganttData };
                }
                case "table": {
                  const tableData: TableData = {
                    columns: widget.data.columns || [],
                    data: widget.data.data || [],
                    sheetName: widget.data.sheetName || "",
                    tableName: widget.data.tableName || "",
                  };
                  return { ...widget, data: tableData };
                }
                case "title": {
                  const titleData: TitleWidgetData = {
                    content: widget.data.content || "Your Dashboard Title",
                    fontSize: widget.data.fontSize ?? 24,
                    textColor: widget.data.textColor || "#000000",
                    backgroundColor: widget.data.backgroundColor || "#ffffff",
                    titleAlignment: widget.data.titleAlignment || "center",
                  };
                  return { ...widget, data: titleData };
                }
                default:
                  console.warn(`Unknown widget type: ${widget.type}. Widget will be skipped.`);
                  return null;
              }
            })
            .filter((widget: Widget | null) => widget !== null) as Widget[];
          if (!updatedWidgets.some((w: Widget) => w.type === "title")) {
            updatedWidgets.unshift(defaultTitleWidget);
            updateLayoutsForNewWidgets([defaultTitleWidget]);
          }
          setWidgets(updatedWidgets);
          updateLayoutsForNewWidgets(updatedWidgets);
        }
      } catch (error) {
        console.error("Error fetching and migrating widgets:", error);
        message.error("Failed to load widgets from server.");
      }
    };
    migrateWidgets();
  }, [currentDashboardId, currentDashboard, dashboardLoaded]);
  const saveAsTemplate = async () => {
    try {
      if (!userEmail) {
        message.error("No user email found. Cannot save as template.");
        return;
      }
      const templateToSave: TemplateItem = {
        id: currentTemplateId ?? "",
        name: dashboardTitle,
        widgets: widgets,
        layouts,
        borderSettings: dashboardBorderSettings,
      };
      if (currentTemplateId) {
        const updatedTemplate = await updateTemplate(currentTemplateId, templateToSave);
        message.success("Template updated successfully!");
      } else {
        const newTemplate = await createTemplate(templateToSave);
        message.success("Template created successfully!");
        setCurrentTemplateId(newTemplate.id);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      message.error("Failed to save template to the server.");
    }
  };
  const excelSerialToDateString = (serial: number): string => {
    if (typeof serial !== "number" || isNaN(serial)) {
      console.warn("Invalid serial number:", serial);
      return "";
    }
    const date = new Date((serial - 25569) * 86400000);
    return date.toISOString().split("T")[0];
  };
  const applyListDataValidation = (
    range: Excel.Range,
    source: string,
    errorMessage: string,
    errorTitle: string,
    promptMessage: string,
    promptTitle: string
  ) => {
    const validationRule: Excel.DataValidationRule = {
      list: {
        source: source,
        inCellDropDown: true,
      },
    };
    range.dataValidation.rule = validationRule;
    range.dataValidation.errorAlert = {
      message: errorMessage,
      showAlert: true,
      style: Excel.DataValidationAlertStyle.stop,
      title: errorTitle,
    };
    range.dataValidation.prompt = {
      message: promptMessage,
      showPrompt: true,
      title: promptTitle,
    };
  };
  const insertProjectManagementTemplate = async () => {
    try {
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheetName = "Gantt";
        let sheet = context.workbook.worksheets.getItemOrNullObject(sheetName);
        await context.sync();
        if (sheet.isNullObject) {
          sheet = context.workbook.worksheets.add(sheetName);
        } else {
          sheet.getRange().clear();
        }
        sheet.activate();
        await context.sync();
        const existingTable = sheet.tables.getItemOrNullObject("GanttTable");
        existingTable.load("name");
        await context.sync();
        if (!existingTable.isNullObject) {
          existingTable.delete();
          await context.sync();
          console.log("Existing GanttTable deleted.");
        }
        const entireSheet = sheet.getRange();
        entireSheet.clear(Excel.ClearApplyTo.all);
        await context.sync();
        console.log("Worksheet cleared.");
        const headers = [
          "Task Name",
          "Task Type",
          "Start Date",
          "End Date",
          "Completed Date",
          "Duration (Days)",
          "Actual Duration (Days)",
          "Progress %",
          "Dependencies",
        ];
        const headerRange = sheet.getRange("A1:I1");
        headerRange.values = [headers];
        headerRange.format.font.bold = true;
        headerRange.format.fill.color = "#4472C4";
        headerRange.format.font.color = "white";
        console.log("Headers inserted on A1:I1:", headers);
        const columnWidths = [25, 15, 15, 15, 15, 18, 22, 12, 20];
        columnWidths.forEach((width, index) => {
          const columnLetter = String.fromCharCode(65 + index);
          sheet.getRange(`${columnLetter}:${columnLetter}`).columnWidth = width;
        });
        console.log("Column widths set:", columnWidths);
        const parseDate = (dateString: string): Date => {
          const [month, day, year] = dateString.split("/").map(Number);
          return new Date(year, month - 1, day);
        };
        const dateToExcelSerial = (date: Date): number => {
          return date.getTime() / 86400000 + 25569;
        };
        const sampleData = [
          [
            "Design Interface",
            "Task",
            dateToExcelSerial(parseDate("01/01/2023")),
            dateToExcelSerial(parseDate("01/09/2023")),
            dateToExcelSerial(parseDate("01/10/2023")),
            "",
            "",
            50,
            "",
          ],
          [
            "Develop Backend",
            "Task",
            dateToExcelSerial(parseDate("01/05/2023")),
            dateToExcelSerial(parseDate("01/19/2023")),
            "",
            "",
            "",
            30,
            "Design Interface",
          ],
          [
            "Testing",
            "Task",
            dateToExcelSerial(parseDate("01/15/2023")),
            dateToExcelSerial(parseDate("01/24/2023")),
            "",
            "",
            "",
            0,
            "Develop Backend",
          ],
          [
            "Deployment",
            "Milestone",
            dateToExcelSerial(parseDate("01/30/2023")),
            dateToExcelSerial(parseDate("01/30/2023")),
            dateToExcelSerial(parseDate("01/30/2023")),
            "",
            "",
            0,
            "Testing",
          ],
          [
            "Project Complete",
            "Project",
            dateToExcelSerial(parseDate("01/01/2023")),
            dateToExcelSerial(parseDate("01/29/2023")),
            dateToExcelSerial(parseDate("01/30/2023")),
            "",
            "",
            100,
            "",
          ],
        ];
        const dataRowStart = 2;
        const dataRowEnd = dataRowStart + sampleData.length - 1;
        const dataRangeAddress = `A${dataRowStart}:I${dataRowEnd}`;
        const dataRange = sheet.getRange(dataRangeAddress);
        dataRange.values = sampleData;
        console.log("Sample data inserted on A2:I6:", sampleData);
        const dateColumns = ["C", "D", "E"];
        dateColumns.forEach((col) => {
          const range = sheet.getRange(`${col}${dataRowStart}:${col}${dataRowEnd}`);
          range.numberFormat = [["mm/dd/yyyy"]];
        });
        const durationColumns = ["F", "G"];
        durationColumns.forEach((col) => {
          const range = sheet.getRange(`${col}${dataRowStart}:${col}${dataRowEnd}`);
          range.numberFormat = [["0"]];
        });
        const progressRange = sheet.getRange(`H${dataRowStart}:H${dataRowEnd}`);
        const progressFormat = "0";
        const progressFormats = Array.from({ length: dataRowEnd - dataRowStart + 1 }, () => [progressFormat]);
        progressRange.numberFormat = progressFormats;
        console.log("Progress column formatted as number");
        try {
          const table = sheet.tables.add(`A1:I${dataRowEnd}`, true);
          table.name = "GanttTable";
          console.log("GanttTable created successfully.");
        } catch (tableError) {
          console.error("Failed to create GanttTable:", tableError);
          throw tableError;
        }
        try {
          const table = sheet.tables.getItem("GanttTable");
          const durationColumn = table.columns.getItemAt(5); // Column F
          const actualDurationColumn = table.columns.getItemAt(6); // Column G
          const durationFormula = "=[@[End Date]]-[@[Start Date]]";
          const actualDurationFormula = "=IF([@[Completed Date]]='', '', [@[Completed Date]] - [@[Start Date]])";
          const durationRange = durationColumn.getDataBodyRange();
          const actualDurationRange = actualDurationColumn.getDataBodyRange();
          durationRange.load("rowCount");
          actualDurationRange.load("rowCount");
          await context.sync();
          durationRange.formulas = Array(durationRange.rowCount).fill([durationFormula]);
          actualDurationRange.formulas = Array(actualDurationRange.rowCount).fill([actualDurationFormula]);
          await context.sync();
        } catch (calcError) {
          console.error("Error setting calculated columns:", calcError);
          throw calcError;
        }
        const taskTypeOptions = ["Task", "Milestone", "Project"];
        const taskTypeValues = taskTypeOptions.join(",");
        const taskTypeRangeAddress = `B${dataRowStart}:B${dataRowEnd}`;
        const taskTypeRange = sheet.getRange(taskTypeRangeAddress);
        applyListDataValidation(
          taskTypeRange,
          taskTypeValues,
          `Please select a valid Task Type: ${taskTypeOptions.join(", ")}`,
          "Invalid Task Type",
          "Select a Task Type from the dropdown.",
          "Task Type"
        );
        const taskNamesRangeName = "TaskNames";
        const taskNamesRangeAddress = `A${dataRowStart}:A${dataRowEnd}`;
        const taskNamesRange = sheet.getRange(taskNamesRangeAddress);
        taskNamesRange.load("values");
        const existingNamedRange = context.workbook.names.getItemOrNullObject(taskNamesRangeName);
        await context.sync();
        if (!existingNamedRange.isNullObject) {
          existingNamedRange.delete();
          await context.sync();
          console.log(`Existing named range "${taskNamesRangeName}" deleted.`);
        }
        try {
          context.workbook.names.add(taskNamesRangeName, taskNamesRange);
          console.log(`Named range "${taskNamesRangeName}" created for range ${taskNamesRangeAddress}`);
        } catch (nameError) {
          console.error(`Error creating named range "${taskNamesRangeName}":`, nameError);
          throw nameError;
        }
        const dependenciesRangeAddress = `I${dataRowStart}:I${dataRowEnd}`;
        const dependenciesRange = sheet.getRange(dependenciesRangeAddress);
        applyListDataValidation(
          dependenciesRange,
          `=${taskNamesRangeName}`,
          "Please select a valid Task Name from the dropdown.",
          "Invalid Dependency",
          "Select a Task Name from the dropdown.",
          "Dependencies"
        );
        dependenciesRange.dataValidation.load(["rule", "errorAlert", "prompt"]);
        await context.sync();
        console.log(`Data validation for Dependencies applied to range ${dependenciesRangeAddress}`);
        const borderEdges = [
          Excel.BorderIndex.edgeTop,
          Excel.BorderIndex.edgeBottom,
          Excel.BorderIndex.edgeLeft,
          Excel.BorderIndex.edgeRight,
          Excel.BorderIndex.insideHorizontal,
          Excel.BorderIndex.insideVertical,
        ];
        borderEdges.forEach((edge) => {
          const border = dataRange.format.borders.getItem(edge);
          border.style = Excel.BorderLineStyle.continuous;
          border.weight = Excel.BorderWeight.thin;
          border.color = "#000000";
        });
        console.log("Borders applied to data range");
        sheet.getUsedRange().format.autofitColumns();
        sheet.getUsedRange().format.autofitRows();
        console.log("Autofit applied to columns and rows");
        sheet.freezePanes.freezeRows(1);
        console.log("Top row frozen");
        await context.sync();
        message.success("Project management template inserted successfully.");
      });
    } catch (error) {
      console.error("Error inserting template into Excel:", error);
      message.error("Failed to insert template into Excel.");
    }
  };
  const createGanttChart = async () => {
    try {
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const table = sheet.tables.getItemOrNullObject("GanttTable");
        table.load(["name", "dataBodyRange", "rows"]);
        await context.sync();
        if (table.isNullObject) {
          message.warning("GanttTable not found on the active worksheet.");
          return;
        }
        const dataRange = table.getDataBodyRange();
        dataRange.load("values");
        await context.sync();
        const data: any[][] = dataRange.values;
        if (!data || data.length === 0) {
          message.warning("No Gantt data found in the GanttTable.");
          return;
        }
        const excelSerialToDate = (serial: number): Date => {
          return new Date((serial - 25569) * 86400000);
        };
        const tasks: Task[] = data
          .map((row: any[]) => {
            const taskName: string = row[0];
            const taskType: string = row[1];
            const startSerial: number = row[2];
            const endSerial: number = row[3];
            const completedSerial: number | "" = row[4];
            const progress: number = row[7];
            const dependenciesRaw: string = row[8];
            if (
              typeof startSerial !== "number" ||
              typeof endSerial !== "number" ||
              (completedSerial !== "" && typeof completedSerial !== "number")
            ) {
              console.warn(`Invalid serial numbers for task: ${taskName}, row`);
              return null;
            }
            const startDate: Date = excelSerialToDate(startSerial);
            const endDate: Date = excelSerialToDate(endSerial);
            const completedDate: Date | undefined =
              completedSerial !== "" ? excelSerialToDate(completedSerial) : undefined;
            if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
              console.warn(`Invalid start date for task: ${taskName}`);
              return null;
            }
            if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
              console.warn(`Invalid end date for task: ${taskName}`);
              return null;
            }
            if (completedSerial !== "" && (!completedDate || isNaN(completedDate.getTime()))) {
              console.warn(`Invalid completed date for task: ${taskName}`);
              return null;
            }
            const dependencies: string = dependenciesRaw
              ? dependenciesRaw
                  .toString()
                  .split(",")
                  .map((dep: string) => `task-${dep.trim().replace(/\s+/g, "-")}`)
                  .join(",")
              : "";
            let color: string;
            if (progress > 75) {
              color = "#00FF00";
            } else if (progress > 50) {
              color = "#FFFF00";
            } else {
              color = "#FF0000";
            }
            return {
              id: `task-${taskName.replace(/\s+/g, "-")}`,
              name: taskName,
              type: taskType.toLowerCase(),
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              progress: progress,
              dependencies: dependencies,
              color: color,
            } as Task;
          })
          .filter((task) => task !== null) as Task[];
        setWidgets((prevWidgets: Widget[]) => {
          let updatedWidgets: Widget[];
          const ganttWidgetExists = prevWidgets.some((widget: Widget) => widget.type === "gantt");
          if (ganttWidgetExists) {
            updatedWidgets = prevWidgets.map((widget: Widget) => {
              if (widget.type === "gantt") {
                return { ...widget, data: { ...widget.data, tasks } };
              }
              return widget;
            });
          } else {
            const newGanttWidget: Widget = {
              id: `gantt-${uuidv4()}`,
              type: "gantt",
              data: {
                tasks,
                title: "Gantt Chart",
                titleAlignment: "left",
              } as GanttWidgetData,
            };
            updatedWidgets = [...prevWidgets, newGanttWidget];
            updateLayoutsForNewWidgets(updatedWidgets);
          }
          if (currentDashboard) {
            editDashboard(currentDashboard).then(() => {
              setCurrentDashboard(currentDashboard);
              message.success("Gantt chart data prepared and saved successfully!");
            });
          }
          return updatedWidgets;
        });
      });
    } catch (error) {
      console.error("Error creating Gantt chart:", error);
      message.error("Failed to create Gantt chart.");
    }
  };
  const generateProjectManagementTemplateAndGanttChart = async () => {
    await insertProjectManagementTemplate();
    await createGanttChart();
  };
  const undo = () => {
    if (pastStates.length > 0) {
      isUndoRedoRef.current = true;
      const previousState = pastStates[pastStates.length - 1];
      setPastStates(pastStates.slice(0, pastStates.length - 1));
      setFutureStates([{ widgets, layouts }, ...futureStates]);
      setWidgets(previousState.widgets);
      setLayouts(previousState.layouts);
      if (currentDashboardId && currentDashboard) {
        const updatedDashboard: DashboardItem = {
          ...currentDashboard,
          workbookId: currentWorkbookId,
          components: previousState.widgets,
          layouts: previousState.layouts,
          title: dashboardTitle,
        };
        axios.put(`/api/dashboards/${currentDashboardId}`, updatedDashboard).catch((err) => {
          console.error("Error syncing undo to server:", err);
        });
      }
    }
  };
  const redo = () => {
    if (futureStates.length > 0) {
      isUndoRedoRef.current = true;
      const nextState = futureStates[0];
      setFutureStates(futureStates.slice(1));
      setPastStates([...pastStates, { widgets, layouts }]);
      setWidgets(nextState.widgets);
      setLayouts(nextState.layouts);
      if (currentDashboardId && currentDashboard) {
        const updatedDashboard: DashboardItem = {
          ...currentDashboard,
          workbookId: currentWorkbookId,
          components: nextState.widgets,
          layouts: nextState.layouts,
          title: dashboardTitle,
        };
        axios.put(`/api/dashboards/${currentDashboardId}`, updatedDashboard).catch((err) => {
          console.error("Error syncing redo to server:", err);
        });
      }
    }
  };
  const saveDashboardVersion = () => {
    if (!currentDashboardId || !currentDashboard) {
      message.error("No dashboard is currently active.");
      return;
    }
    const newVersion: DashboardVersion = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      title: dashboardTitle,
      components: widgets,
      layouts,
      borderSettings: dashboardBorderSettings,
    };
    const updatedVersions = [newVersion];
    if (currentDashboard.versions && currentDashboard.versions.length > 0) {
      updatedVersions.push(...currentDashboard.versions);
    }
    const limitedVersions = updatedVersions.slice(0, 5);
    const updatedDashboard: DashboardItem = {
      ...currentDashboard,
      workbookId: currentWorkbookId,
      versions: limitedVersions,
      components: widgets,
      layouts,
      title: dashboardTitle,
      borderSettings: dashboardBorderSettings,
    };
    axios
      .put(`/api/dashboards/${currentDashboardId}`, updatedDashboard)
      .then(() => {
        message.success("Dashboard version saved.");
        setCurrentDashboard(updatedDashboard);
        setDashboards((prev) => {
          const idx = prev.findIndex((d) => d.id === currentDashboardId);
          if (idx !== -1) {
            const newDashboards = [...prev];
            newDashboards[idx] = updatedDashboard;
            return newDashboards;
          }
          return prev;
        });
      })
      .catch((err) => {
        console.error("Error saving version to server:", err);
        message.error("Failed to save dashboard version.");
      });
  };
  const restoreDashboardVersion = (versionId: string) => {
    if (!currentDashboardId || !currentDashboard || !currentDashboard.versions) {
      message.error("No versions available for this dashboard.");
      return;
    }
    const version = currentDashboard.versions.find((v) => v.id === versionId);
    if (!version) {
      message.error("Version not found.");
      return;
    }
    setWidgets(version.components);
    setLayouts(version.layouts);
    setDashboardTitle(version.title);
    const updatedDashboard: DashboardItem = {
      ...currentDashboard,
      workbookId: currentWorkbookId,
      components: version.components,
      layouts: version.layouts,
      title: version.title,
    };
    axios
      .put(`/api/dashboards/${currentDashboardId}`, updatedDashboard)
      .then(() => {
        message.success("Dashboard restored to selected version.");
        setCurrentDashboard(updatedDashboard);
        setDashboards((prev) => {
          const idx = prev.findIndex((d) => d.id === currentDashboardId);
          if (idx !== -1) {
            const newDashboards = [...prev];
            newDashboards[idx] = updatedDashboard;
            return newDashboards;
          }
          return prev;
        });
      })
      .catch((err) => {
        console.error("Error restoring version to server:", err);
        message.error("Failed to restore version.");
      });
  };
  const updateLayoutsForNewWidgets = (newWidgets: Widget[]) => {
    setLayouts((prevLayouts) => {
      const updatedLayouts: { [key: string]: GridLayoutItem[] } = { ...prevLayouts };
      const breakpointList: Breakpoint[] = ["lg", "md", "sm", "xl", "xxl"];
      breakpointList.forEach((breakpoint) => {
        const breakpointCols = GRID_COLS[breakpoint];
        const existingItemIds = new Set(updatedLayouts[breakpoint]?.map((item) => item.i));
        const widgetsToAdd = newWidgets.filter((widget) => !existingItemIds.has(widget.id));
        let yOffset = updatedLayouts[breakpoint]?.reduce((maxY, item) => Math.max(maxY, item.y + item.h), 0) || 0;
        const newLayoutItems = widgetsToAdd.map((widget) => {
          let size = WIDGET_SIZES[widget.type] || { w: 8, h: 4 };
          if (size.w > breakpointCols) {
            size.w = breakpointCols;
          }
          let x = 0;
          if (widget.type === "title") {
            x = Math.floor((breakpointCols - size.w) / 2);
          }
          const layoutItem: GridLayoutItem = {
            i: widget.id,
            x,
            y: yOffset,
            w: size.w,
            h: size.h,
            minW: 1,
            minH: 1,
          };
          yOffset += size.h;
          return layoutItem;
        });
        updatedLayouts[breakpoint] = [...(updatedLayouts[breakpoint] || []), ...newLayoutItems];
      });
      return updatedLayouts;
    });
  };
  const editDashboard = async (dashboard: DashboardItem): Promise<void> => {
    try {
      if (!dashboard.workbookId) {
        dashboard.workbookId = currentWorkbookId;
      }
      if (!dashboard.userEmail) {
        dashboard.userEmail = userEmail;
      }
      const response = await axios.put(`/api/dashboards/${dashboard.id}`, dashboard);
      const updated = response.data as DashboardItem;
      setDashboards((prevDashboards) => {
        const idx = prevDashboards.findIndex((d) => d.id === updated.id);
        if (idx !== -1) {
          const newDashboards = [...prevDashboards];
          newDashboards[idx] = updated;
          return newDashboards;
        }
        return prevDashboards;
      });
    } catch (err) {
      console.error("Error updating dashboard on server:", err);
      message.error("Failed to update dashboard on server.");
      throw err;
    }
  };
  const deleteDashboard = async (id: string) => {
    try {
      await deleteDashboardById(id);
      setDashboards((prev) => prev.filter((d) => d.id !== id));
      if (currentDashboardId === id) {
        setCurrentDashboard(null);
        setCurrentDashboardId(null);
        setWidgets([defaultTitleWidget]);
        setLayouts({});
        setDashboardTitle("My Dashboard");
      }
      message.success("Dashboard deleted successfully!");
    } catch (err) {
      console.error("Error deleting dashboard on server:", err);
      message.error("Failed to delete dashboard.");
    }
  };
  const getAvailableTables = async (): Promise<{ name: string; sheetName: string; rangeAddress: string }[]> => {
    try {
      return await Excel.run(async (context: Excel.RequestContext) => {
        const tables = context.workbook.tables;
        tables.load("items/name, items/worksheet/name");
        await context.sync();
        return tables.items.map((table) => ({
          name: table.name,
          sheetName: table.worksheet.name,
          rangeAddress: table.name,
        }));
      });
    } catch (error) {
      console.error("Error fetching tables from Excel:", error);
      message.error("Failed to fetch tables from Excel.");
      return [];
    }
  };
  const addWidgetFunc = useCallback(
    async (
      type: "text" | "chart" | "gantt" | "image" | "metric" | "table" | "line" | "title",
      data?:
        | TextData
        | ChartData
        | GanttWidgetData
        | ImageWidgetData
        | MetricData
        | TableData
        | LineWidgetData
        | TitleWidgetData
    ): Promise<void> => {
      if (type === "title" && widgets.some((w) => w.type === "title")) {
        message.warning("A title widget already exists.");
        return;
      }
      const newKey = `${type}-${uuidv4()}`;
      let newWidget: Widget;
      let highestZIndex = widgets.reduce((max, w) => Math.max(max, w.zIndex ?? 0), 0);
      const newZIndex = highestZIndex + 1;
      if (type === "table") {
        try {
          const availableTables = await getAvailableTables();
          if (availableTables.length === 0) {
            message.warning("No tables found in the Excel workbook.");
            return;
          }
          newWidget = {
            id: newKey,
            type,
            name: "New Table",
            data: {
              columns: [],
              data: [],
              sheetName: "",
              tableName: "",
            } as TableData,
            zIndex: newZIndex,
          };
          setWidgetToPrompt({
            widget: newWidget,
            onComplete: async (updatedWidget: Widget) => {
              updateWidgetsWithHistory((prevWidgets) => [...prevWidgets, updatedWidget]);
              updateLayoutsForNewWidgets([...widgets, updatedWidget]);
              const { sheetName, tableName } = updatedWidget.data as TableData;
              if (sheetName && tableName) {
                await readTableFromExcel(newWidget.id, sheetName, tableName);
              } else {
                message.error("Sheet name or table name is missing.");
              }
            },
          });
          setIsSelectTableModalVisible(true);
        } catch (error) {
          console.error("Error adding table widget:", error);
          message.error("Failed to add table widget.");
          return;
        }
      }
      if (data) {
        newWidget = {
          id: newKey,
          type,
          data,
        } as Widget;
      } else {
        switch (type) {
          case "line":
            newWidget = {
              id: newKey,
              type: "line",
              data: {
                color: "#000000",
                thickness: 2,
                style: "solid",
                orientation: "horizontal",
              } as LineWidgetData,
              zIndex: newZIndex,
            };
            break;
          case "metric":
            newWidget = {
              id: newKey,
              type: "metric",
              data: {
                cellAddress: "C3",
                worksheetName: "Sheet1",
                targetValue: 0,
                comparison: "greater",
                fontSize: 28,
                displayName: "KPI",
                format: "number",
                currentValue: 0,
                titleAlignment: "left",
                backgroundColor: "#ffffff",
                textColor: "#000000",
              } as MetricData,
              zIndex: newZIndex,
            };
            break;
          case "text":
            newWidget = {
              id: newKey,
              type: "text",
              data: {
                content: "",
                fontSize: 16,
                textColor: "#000000",
                backgroundColor: "#ffffff",
                titleAlignment: "left",
              } as TextData,
              zIndex: newZIndex,
            };
            break;
          case "image":
            newWidget = {
              id: newKey,
              type: "image",
              data: {
                src: "",
                associatedRange: "",
                worksheetName: "",
              } as ImageWidgetData,
              zIndex: newZIndex,
            };
            break;
          case "chart":
            newWidget = {
              id: newKey,
              type: "chart",
              data: {
                type: "bar",
                title: "Sample Chart",
                labels: ["January", "February", "March"],
                datasets: [
                  {
                    label: "Sample Data",
                    data: [10, 20, 30],
                    backgroundColor: "#4caf50",
                  },
                ],
                titleAlignment: "left",
                associatedRange: "",
                worksheetName: "",
              } as ChartData,
              zIndex: newZIndex,
            };
            break;
          case "gantt":
            newWidget = {
              id: newKey,
              type: "gantt",
              data: {
                tasks: [],
                title: "Gantt Chart",
                titleAlignment: "left",
              } as GanttWidgetData,
              zIndex: newZIndex,
            };
            break;
          case "title":
            newWidget = {
              id: newKey,
              type: "title",
              data: {
                content: "Your Dashboard Title",
                fontSize: 24,
                textColor: "#000000",
                backgroundColor: "#ffffff",
                titleAlignment: "center",
              } as TitleWidgetData,
              zIndex: newZIndex,
            };
            break;
          default:
            throw new Error(`Unsupported widget type: ${type}`);
        }
      }
      let missingFields: string[] = [];
      if (type === "metric") {
        const metricData = newWidget.data as MetricData;
        if (!metricData.worksheetName || !metricData.cellAddress) {
          missingFields.push("worksheetName", "cellAddress");
        }
      }
      if (missingFields.length > 0) {
        message.warning(`Please provide the following fields: ${missingFields.join(", ")}`);
        setPendingWidget(newWidget);
        return;
      }
      updateWidgetsWithHistory((prevWidgets) => {
        const newWidgets = [...prevWidgets, newWidget];
        console.log("addWidgetFunc: New widgets after addition:", newWidgets);
        updateLayoutsForNewWidgets(newWidgets);
        console.log("addWidgetFunc: Layouts updated for new widgets.");
        return newWidgets;
      });
    },
    [
      currentDashboard,
      currentDashboardId,
      currentWorkbookId,
      layouts,
      dashboardTitle,
      widgets,
      updateWidgetsWithHistory,
      updateLayoutsForNewWidgets,
      setCurrentDashboard,
      readTableFromExcel,
      getAvailableTables,
    ]
  );
  const handleWidgetDetailsComplete = (updatedWidget: Widget) => {
    if (pendingWidget && updatedWidget.id === pendingWidget.id) {
      setPendingWidget(undefined);
      if (updatedWidget.type === "table") {
        setIsSelectTableModalVisible(true);
      } else {
        updateWidgetsWithHistory((prevWidgets) => {
          const newWidgets = [...prevWidgets, updatedWidget];
          updateLayoutsForNewWidgets(newWidgets);
          return newWidgets;
        });
        message.success(
          `${updatedWidget.type.charAt(0).toUpperCase() + updatedWidget.type.slice(1)} widget added successfully!`
        );
      }
    } else {
      if (!widgetToPrompt) return;
      const { widget, onComplete } = widgetToPrompt;
      updateWidgetsWithHistory((prevWidgets) => {
        const newWidgets = prevWidgets.map((w) => (w.id === widget.id ? updatedWidget : w));
        return newWidgets;
      });
      onComplete(updatedWidget);
    }
    setWidgetToPrompt(null);
  };
  const removeWidgetFunc = useCallback(
    (id: string) => {
      updateWidgetsWithHistory((prevWidgets) => {
        const newWidgets = prevWidgets.filter((widget) => widget.id !== id);
        setLayouts((prevLayouts) => {
          const updatedLayouts = Object.fromEntries(
            Object.entries(prevLayouts).map(([breakpoint, layoutItems]) => [
              breakpoint,
              layoutItems.filter((item) => item.i !== id),
            ])
          );
          return updatedLayouts;
        });
        return newWidgets;
      });
    },
    [
      currentDashboard,
      dashboards,
      editDashboard,
      setDashboards,
      setCurrentDashboard,
      dashboardTitle,
      layouts,
      currentDashboardId,
    ]
  );
  const updateWidgetFunc = useCallback(
    (
      id: string,
      updatedData: Partial<
        | TextData
        | ChartData
        | GanttWidgetData
        | ImageWidgetData
        | TableData
        | MetricData
        | LineWidgetData
        | TitleWidgetData
      > & { zIndex?: number }
    ) => {
      updateWidgetsWithHistory((prevWidgets) => {
        const newWidgets = prevWidgets.map((widget) => {
          if (widget.id !== id) return widget;
          const { zIndex, ...restUpdatedData } = updatedData;
          let updatedWidget = { ...widget };
          if (zIndex !== undefined) {
            updatedWidget.zIndex = zIndex;
          }
          switch (widget.type) {
            case "text":
              return {
                ...widget,
                data: {
                  ...widget.data,
                  ...restUpdatedData,
                  content: (updatedData as Partial<TextData>).content ?? widget.data.content,
                  fontSize: (updatedData as Partial<TextData>).fontSize ?? widget.data.fontSize,
                  textColor: (updatedData as Partial<TextData>).textColor ?? widget.data.textColor,
                  backgroundColor: (updatedData as Partial<TextData>).backgroundColor ?? widget.data.backgroundColor,
                  titleAlignment: (updatedData as Partial<TextData>).titleAlignment ?? widget.data.titleAlignment,
                } as TextData,
              };
            case "title":
              return {
                ...widget,
                data: {
                  ...widget.data,
                  ...restUpdatedData,
                } as TitleWidgetData,
              };
            case "chart":
              return {
                ...widget,
                data: {
                  ...widget.data,
                  ...restUpdatedData,
                } as ChartData,
              };
            case "gantt":
              return {
                ...widget,
                data: {
                  ...widget.data,
                  ...restUpdatedData,
                } as GanttWidgetData,
              };
            case "line":
              return {
                ...widget,
                data: {
                  ...widget.data,
                  ...restUpdatedData,
                } as LineWidgetData,
              };
            case "metric":
              return {
                ...widget,
                data: {
                  ...widget.data,
                  ...restUpdatedData,
                } as MetricData,
              };
            case "image":
              return {
                ...widget,
                data: {
                  ...widget.data,
                  ...restUpdatedData,
                } as ImageWidgetData,
              };
            case "table":
              return {
                ...widget,
                data: {
                  ...widget.data,
                  ...restUpdatedData,
                } as TableData,
              };
            default:
              return widget;
          }
        });
        return newWidgets;
      });
      message.success("Widget updated successfully!");
    },
    [
      currentDashboard,
      dashboards,
      editDashboard,
      setDashboards,
      setCurrentDashboard,
      dashboardTitle,
      layouts,
      currentDashboardId,
    ]
  );
  const migrateChartIndexToAssociatedRange = async () => {
    if (!currentDashboardId || !currentDashboard) {
      console.warn("No current dashboard available for migration.");
      return;
    }
    try {
      await Excel.run(async (context) => {
        const worksheets = context.workbook.worksheets;
        worksheets.load("items");
        await context.sync();
        let globalChartIndex = 0;
        const chartMap: { [key: number]: { worksheetName: string; associatedRange: string } } = {};
        for (const sheet of worksheets.items) {
          const charts = sheet.charts;
          charts.load("items");
        }
        await context.sync();
        for (const sheet of worksheets.items) {
          for (const chart of sheet.charts.items) {
            const dataRange = chart.getDataBodyRange();
            dataRange.load("address");
            chartMap[globalChartIndex] = {
              worksheetName: sheet.name,
              associatedRange: "",
            };
            globalChartIndex++;
          }
        }
        await context.sync();
        globalChartIndex = 0;
        for (const sheet of worksheets.items) {
          for (const chart of sheet.charts.items) {
            const key = globalChartIndex;
            const dataRange = chart.getDataBodyRange();
            if (dataRange.address) {
              chartMap[key].associatedRange = dataRange.address.toLowerCase();
              console.log(
                `Mapped chartIndex ${key} to range "${chartMap[key].associatedRange}" on worksheet "${sheet.name}".`
              );
            } else {
              console.warn(`Chart "${chart.name}" on worksheet "${sheet.name}" has no associated data range.`);
            }
            globalChartIndex++;
          }
        }
        setWidgets((prevWidgets: Widget[]) => {
          const newWidgets = prevWidgets.map((widget: Widget) => {
            if (widget.type === "image") {
              const imageData = widget.data as ImageWidgetData & { chartIndex?: number };
              if ("chartIndex" in imageData && imageData.chartIndex !== undefined) {
                const chartIndex = imageData.chartIndex;
                const mapping = chartMap[chartIndex];
                if (mapping && mapping.associatedRange) {
                  return {
                    ...widget,
                    data: {
                      ...imageData,
                      associatedRange: mapping.associatedRange,
                      worksheetName: mapping.worksheetName,
                    },
                  };
                } else {
                  console.warn(`No associatedRange found for chartIndex ${chartIndex} in ImageWidget ${widget.id}.`);
                }
              }
              return widget;
            } else if (widget.type === "chart") {
              const chartData = widget.data as ChartData & { chartIndex?: number };
              if ("chartIndex" in chartData && chartData.chartIndex !== undefined) {
                const chartIndex = chartData.chartIndex;
                const mapping = chartMap[chartIndex];
                if (mapping && mapping.associatedRange) {
                  return {
                    ...widget,
                    data: {
                      ...chartData,
                      associatedRange: mapping.associatedRange,
                      worksheetName: mapping.worksheetName,
                    },
                  };
                } else {
                  console.warn(`No associatedRange found for chartIndex ${chartIndex} in ChartWidget ${widget.id}.`);
                }
              }
              return widget;
            }
            return widget;
          });
          const cleanedWidgets = newWidgets.map((widget) => {
            if (widget.type === "image") {
              const { chartIndex, ...rest } = widget.data as ImageWidgetData & { chartIndex?: number };
              return { ...widget, data: rest };
            } else if (widget.type === "chart") {
              const { chartIndex, ...rest } = widget.data as ChartData & { chartIndex?: number };
              return { ...widget, data: rest };
            }
            return widget;
          });
          const updatedDashboard = {
            ...currentDashboard,
            components: cleanedWidgets,
          };
          axios
            .put(`/api/dashboards/${currentDashboardId}`, updatedDashboard)
            .then(() => {
              message.success("Widgets migrated to use associatedRange successfully.");
            })
            .catch((err) => {
              console.error("Error updating widgets on server:", err);
              message.error("Failed to update migrated widgets on server.");
            });

          return cleanedWidgets;
        });
        console.log("Migration from chartIndex to associatedRange completed.");
      });
    } catch (error) {
      console.error("Error migrating widgets:", error);
      message.error("Failed to migrate widgets to use associatedRange.");
    }
  };
  const importChartImageFromExcel = async () => {
    if (!currentDashboardId || !currentDashboard) {
      console.warn("No current dashboard ID or dashboard available.");
      return;
    }
    try {
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const charts = sheet.charts;
        charts.load("items");
        await context.sync();
        if (charts.items.length > 0) {
          const imagePromises = charts.items.map(async (chart) => {
            const imageResult = chart.getImage() as OfficeExtension.ClientResult<string>;
            await context.sync();
            return imageResult.value;
          });
          const imageResults = await Promise.all(imagePromises);
          setWidgets((prevWidgets: Widget[]) => {
            const nonImageWidgets = prevWidgets.filter((widget: Widget) => widget.type !== "image");
            let imageWidgets = prevWidgets.filter((widget: Widget) => widget.type === "image");
            imageResults.forEach((base64Image, index) => {
              if (imageWidgets[index]) {
                imageWidgets[index].data.src = `data:image/png;base64,${base64Image}`;
              } else {
                imageWidgets.push({
                  id: `image-${uuidv4()}`,
                  type: "image",
                  data: { src: `data:image/png;base64,${base64Image}` },
                });
              }
            });
            imageWidgets = imageWidgets.slice(0, imageResults.length);
            const updatedWidgets = [...nonImageWidgets, ...imageWidgets];
            const updatedDashboard = {
              ...currentDashboard,
              components: updatedWidgets,
            };
            axios
              .put(`/api/dashboards/${currentDashboardId}`, updatedDashboard)
              .then(() => {
                message.success("All chart images imported and updated successfully.");
              })
              .catch((err) => {
                console.error("Error updating widgets on server:", err);
                message.error("Failed to update widgets with imported images on server.");
              });

            return updatedWidgets;
          });
        } else {
          message.warning("No charts found on the active worksheet.");
        }
      });
    } catch (error) {
      console.error("Error importing chart image from Excel:", error);
      message.error("Failed to import chart image from Excel.");
    }
  };
  const copyWidget = useCallback(
    (widget: Widget) => {
      let anotherHighestZIndex = widgets.reduce((max, w) => Math.max(max, w.zIndex ?? 0), 0);
      const anotherNewZIndex = anotherHighestZIndex + 1;
      const newWidget: Widget = {
        ...widget,
        id: `${widget.type}-${uuidv4()}`,
        zIndex: anotherNewZIndex,
      };
      addWidgetFunc(widget.type, newWidget.data);
      message.success("Widget copied!");
    },
    [addWidgetFunc, widgets]
  );
  const refreshAllCharts = useCallback(async () => {
    try {
      let hasError = false;
      let errorMessages: string[] = [];
      await Excel.run(async (context: Excel.RequestContext) => {
        const worksheets = context.workbook.worksheets;
        worksheets.load("items/name");
        await context.sync();
        const rangeMap: { [key: string]: Excel.Range } = {};
        for (const widget of widgets) {
          switch (widget.type) {
            case "chart": {
              const chartData = widget.data as ChartData;
              if (chartData.worksheetName && chartData.associatedRange) {
                const sheet = worksheets.getItemOrNullObject(chartData.worksheetName);
                sheet.load("isNullObject");
                await context.sync();
                if (sheet.isNullObject) {
                  hasError = true;
                  errorMessages.push(
                    `Worksheet "${chartData.worksheetName}" not found for chart widget "${widget.id}".`
                  );
                  continue;
                }
                const range = sheet.getRange(chartData.associatedRange);
                range.load("values");
                const key = `${chartData.worksheetName.toLowerCase()}!${chartData.associatedRange.toLowerCase()}`;
                rangeMap[key] = range;
              } else {
                hasError = true;
                errorMessages.push(`Chart widget "${widget.id}" is missing worksheetName or associatedRange.`);
              }
              break;
            }
            case "metric": {
              const metricData = widget.data as MetricData;
              if (metricData.worksheetName && metricData.cellAddress) {
                const sheet = worksheets.getItemOrNullObject(metricData.worksheetName);
                sheet.load("isNullObject");
                await context.sync();
                if (sheet.isNullObject) {
                  hasError = true;
                  errorMessages.push(
                    `Worksheet "${metricData.worksheetName}" not found for metric widget "${widget.id}".`
                  );
                  continue;
                }
                const range = sheet.getRange(metricData.cellAddress);
                range.load("values");
                const key = `${metricData.worksheetName.toLowerCase()}!${metricData.cellAddress.toLowerCase()}`;
                rangeMap[key] = range;
              } else {
                hasError = true;
                errorMessages.push(`Metric widget "${widget.id}" is missing worksheetName or cellAddress.`);
              }
              break;
            }
            default:
              break;
          }
        }
        if (hasError) {
          message.error(errorMessages.join("\n"));
          return;
        }
        await context.sync();
        const updatedWidgets = widgets.map((widget) => {
          switch (widget.type) {
            case "chart": {
              const chartData = widget.data as ChartData;
              const key = `${chartData.worksheetName?.toLowerCase()}!${chartData.associatedRange?.toLowerCase()}`;
              const range = rangeMap[key];
              if (!range) {
                console.warn(`Range "${key}" not found for Chart widget "${widget.id}".`);
                return widget;
              }
              const data = range.values as any[][];
              if (!data || data.length < 2 || data[0].length < 2) {
                console.warn(
                  `Not enough data in range "${key}" for Chart widget "${widget.id}". ` +
                    `Expected at least 2 rows and 2 columns.`
                );
                return widget;
              }
              const multiDatasetTypes = ["bar", "line", "radar", "candlestick"];
              const singleDatasetTypes = ["pie", "doughnut", "polarArea", "funnel", "treemap"];
              if (chartData.type === "funnel") {
                const labels: string[] = [];
                const funnelValues: number[] = [];
                data.forEach((row, index) => {
                  if (row.length < 2) {
                    console.warn(`Row ${index + 1} in range "${key}" is incomplete.`);
                    return;
                  }
                  const label = row[0];
                  const value = Number(row[1]);
                  if (!isNaN(value)) {
                    labels.push(label);
                    funnelValues.push(value);
                  } else {
                    console.warn(`Invalid value at row ${index + 1} in range "${key}".`);
                  }
                });
                if (labels.length !== funnelValues.length) {
                  console.warn(`Mismatch between labels and data points for Funnel chart "${widget.id}".`);
                  return widget;
                }
                const existingDS = chartData.datasets[0] || {};
                const updatedDataset = {
                  ...existingDS,
                  label: existingDS.label || "Funnel",
                  data: funnelValues,
                  backgroundColor: existingDS.backgroundColor ?? getRandomColor(),
                  borderColor: existingDS.borderColor ?? "#000000",
                  borderWidth: existingDS.borderWidth ?? 1,
                };
                const updatedChartData: ChartData = {
                  ...chartData,
                  labels,
                  datasets: [updatedDataset],
                };
                return { ...widget, data: updatedChartData };
              } else if (chartData.type === "bubble") {
                const xValues = data[1].slice(1).map((n) => +n || 0);
                const yValues = data[2].slice(1).map((n) => +n || 0);
                const rValues = data[3].slice(1).map((n) => +n || 0);
                const points = xValues.map((x, i) => ({
                  x,
                  y: yValues[i],
                  r: rValues[i],
                }));
                const existingDS = chartData.datasets[0] || {};
                const updatedDataset = {
                  ...existingDS,
                  label: existingDS.label || "Bubble Series",
                  data: points,
                  backgroundColor: existingDS.backgroundColor ?? getRandomColor(),
                  borderColor: existingDS.borderColor ?? "#000000",
                  borderWidth: existingDS.borderWidth ?? 1,
                };
                const updatedChartData: ChartData = {
                  ...chartData,
                  labels: data[0].slice(1),
                  datasets: [updatedDataset],
                };
                return { ...widget, data: updatedChartData };
              } else if (chartData.type === "boxplot") {
                const rows = data.slice(1);
                const labels = rows.map((r) => r[0]);
                const datasetValues = rows.map((r) => {
                  const q1 = +r[1];
                  const median = +r[2];
                  const q3 = +r[3];
                  const min = +r[4];
                  const max = +r[5];
                  return [min, q1, median, q3, max];
                });
                const existingDS = chartData.datasets[0] || {};
                const updatedDataset = {
                  ...existingDS,
                  label: existingDS.label ?? "Boxplot Series",
                  data: datasetValues,
                  backgroundColor: existingDS.backgroundColor ?? getRandomColor(),
                  borderColor: existingDS.borderColor ?? "#000000",
                  borderWidth: existingDS.borderWidth ?? 1,
                };
                const updatedChartData = {
                  ...chartData,
                  labels,
                  datasets: [updatedDataset],
                } as unknown as ChartData;
                return { ...widget, data: updatedChartData };
              } else if (chartData.type === "scatter") {
                const xValues = data[1].slice(1).map((n) => +n || 0);
                const yValues = data[2].slice(1).map((n) => +n || 0);
                const points = xValues.map((x, i) => ({
                  x,
                  y: yValues[i],
                }));
                const existingDS = chartData.datasets[0] || {};
                const updatedDataset = {
                  ...existingDS,
                  label: existingDS.label || "Scatter Series",
                  data: points,
                  backgroundColor: existingDS.backgroundColor ?? getRandomColor(),
                  borderColor: existingDS.borderColor ?? "#000000",
                  borderWidth: existingDS.borderWidth ?? 1,
                };
                const updatedChartData: ChartData = {
                  ...chartData,
                  labels: data[0].slice(1),
                  datasets: [updatedDataset],
                };
                return { ...widget, data: updatedChartData };
              } else if (chartData.type === "treemap") {
                const rows = data.slice(1);
                const treeData = rows.map((row, index) => {
                  const name = row[0] || `Item ${index + 1}`;
                  const value = Number(row[1]) || 0;
                  return { name, value };
                });
                const existingDS = chartData.datasets[0] || {};
                const updatedDataset = {
                  ...existingDS,
                  tree: treeData,
                  type: "treemap",
                  label: existingDS.label || "Treemap Data",
                  key: "value",
                  backgroundColor: existingDS.backgroundColor || treeData.map(() => getRandomColor()),
                  borderColor: existingDS.borderColor ?? "#000000",
                  borderWidth: existingDS.borderWidth ?? 1,
                } as any;
                const updatedChartData: ChartData = {
                  ...chartData,
                  labels: data[0].slice(1),
                  datasets: [updatedDataset],
                } as any;
                return { ...widget, data: updatedChartData };
              } else if (multiDatasetTypes.includes(chartData.type)) {
                const labels = data[0].slice(1);
                const updatedDatasets = data.slice(1).map((row, rowIndex) => {
                  const seriesLabel = row[0];
                  const rowData = row.slice(1).map((cell) => Number(cell) || 0);
                  const existingDS = chartData.datasets[rowIndex] || {};
                  return {
                    ...existingDS,
                    label: seriesLabel,
                    data: rowData,
                    backgroundColor: existingDS.backgroundColor ?? getRandomColor(),
                    borderColor: existingDS.borderColor ?? "#000000",
                    borderWidth: existingDS.borderWidth ?? 1,
                  };
                });
                const updatedChartData: ChartData = {
                  ...chartData,
                  labels,
                  datasets: updatedDatasets,
                };
                return { ...widget, data: updatedChartData };
              } else if (singleDatasetTypes.includes(chartData.type)) {
                const labels = data[0].slice(1);
                const secondRow = data[1] || [];
                const existingFirst = chartData.datasets[0] || {};
                const updatedDataset = {
                  ...existingFirst,
                  label: secondRow[0] || existingFirst.label || "Series",
                  data: secondRow.slice(1).map((cell: any) => Number(cell) || 0),
                  backgroundColor: Array.isArray(existingFirst.backgroundColor)
                    ? existingFirst.backgroundColor
                    : labels.map(() => getRandomColor()),
                  borderColor: existingFirst.borderColor || "#000000",
                  borderWidth: existingFirst.borderWidth ?? 1,
                };
                const updatedChartData: ChartData = {
                  ...chartData,
                  labels,
                  datasets: [updatedDataset],
                };
                return { ...widget, data: updatedChartData };
              } else {
                console.warn(`Chart type "${chartData.type}" not explicitly handled; leaving data unmodified.`);
                return widget;
              }
            }
            case "metric": {
              const metricData = widget.data as MetricData;
              const key = `${metricData.worksheetName.toLowerCase()}!${metricData.cellAddress.toLowerCase()}`;
              const range = rangeMap[key];
              if (range) {
                const cellValue = range.values[0][0];
                const newValue = parseFloat(cellValue);
                if (!isNaN(newValue)) {
                  const updatedData: MetricData = {
                    ...metricData,
                    currentValue: newValue,
                  };
                  return { ...widget, data: updatedData };
                } else {
                  console.warn(`The value in ${metricData.worksheetName}!${metricData.cellAddress} is not a number.`);
                }
              } else {
                console.warn(`Range ${key} not found for Metric Widget ${widget.id}.`);
              }
              return widget;
            }
            default:
              return widget;
          }
        });
        setWidgets(updatedWidgets);
        if (currentDashboard) {
          const updatedDashboard = {
            ...currentDashboard,
            components: updatedWidgets,
          };
          try {
            await axios.put(`/api/dashboards/${currentDashboard.id}`, updatedDashboard);
            message.success("Charts and metrics have been refreshed and saved successfully.");
          } catch (err) {
            console.error("Error updating dashboard on server:", err);
            message.error("Failed to update dashboard on server.");
          }
          setCurrentDashboard(updatedDashboard);
          const updatedDashboards = dashboards.map((d) => (d.id === currentDashboard.id ? updatedDashboard : d));
          setDashboards(updatedDashboards);
        }
      });
      await importChartImageFromExcel();
    } catch (error) {
      if (error instanceof OfficeExtension.Error) {
        console.error(`Office.js Error: ${error.code} - ${error.message}`);
        message.error(`Office.js Error: ${error.code} - ${error.message}`);
      } else {
        console.error("Unexpected Error:", error);
        message.error("An unexpected error occurred while refreshing charts.");
      }
    }
  }, [
    widgets,
    setWidgets,
    importChartImageFromExcel,
    updateWidgetFunc,
    addWidgetFunc,
    currentDashboard,
    currentWorkbookId,
  ]);
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
  async function refreshTableWidgetData(widgetId: string) {
    const widget = widgets.find((w) => w.id === widgetId && w.type === "table");
    if (!widget) {
      message.error(`No table widget found with ID: ${widgetId}`);
      return;
    }
    const tableData = widget.data as TableData;
    const { sheetName, tableName } = tableData;
    if (!sheetName || !tableName) {
      message.error("Sheet name or table name is missing on this widget.");
      return;
    }
    try {
      await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getItem(sheetName);
        const table = sheet.tables.getItem(tableName);
        const range = table.getRange();
        range.load(["values"]);
        await context.sync();
        const values = range.values;
        if (!values || values.length < 2) {
          message.warning("The selected table does not contain enough data.");
          return;
        }
        const headers = values[0] as string[];
        const dataRows = values.slice(1);
        const columns = headers.map((header, colIndex) => ({
          title: header,
          dataIndex: `col${colIndex}`,
          key: `col${colIndex}`,
        }));
        const data = dataRows.map((row: any[], rowIndex: number) => {
          const rowObject: Record<string, any> = { key: rowIndex };
          row.forEach((cellValue, colIndex) => {
            rowObject[`col${colIndex}`] = cellValue;
          });
          return rowObject;
        });
        updateWidgetsWithHistory((prevWidgets) =>
          prevWidgets.map((w) => {
            if (w.id === widgetId && w.type === "table") {
              return {
                ...w,
                data: {
                  ...w.data,
                  columns,
                  data,
                } as TableData,
              };
            }
            return w;
          })
        );
      });
    } catch (error: any) {
      if (error.code === "InvalidOperationInCellEditMode") {
        message.error("Excel is in cell-editing mode. Please press Enter or Esc...");
      } else {
        console.error("Error refreshing table data:", error);
        message.error("Failed to refresh table data.");
      }
    }
  }
  async function readTableFromExcel(widgetId: string, sheetName: string, tableName: string) {
    try {
      await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getItem(sheetName);
        const table = sheet.tables.getItem(tableName);
        const range = table.getRange();
        range.load(["values"]);
        await context.sync();
        const values = range.values;
        if (!values || values.length < 2) {
          message.warning("The selected table does not contain enough data.");
          return;
        }
        const headers = values[0] as string[];
        const dataRows = values.slice(1);
        const columns = headers.map((header, colIndex) => ({
          title: header,
          dataIndex: `col${colIndex}`,
          key: `col${colIndex}`,
        }));
        const data = dataRows.map((row: any[], rowIndex: number) => {
          const rowObject: Record<string, any> = { key: rowIndex };
          row.forEach((cellValue, colIndex) => {
            rowObject[`col${colIndex}`] = cellValue;
          });
          return rowObject;
        });
        updateWidgetFunc(widgetId, {
          columns,
          data,
          sheetName,
          tableName,
        } as TableData);
      });
    } catch (error) {
      console.error("Error reading table data from Excel", error);
      message.error("Failed to read table data from Excel.");
    }
  }
  const readDataFromExcel = async () => {
    if (!currentDashboard || !currentDashboard.workbookId) {
      message.error("No dashboard or workbook ID found.");
      return;
    }
    if (currentWorkbookId !== currentDashboard.workbookId) {
      message.warning("This dashboard is not associated with the currently open workbook.");
      return;
    }
    try {
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const range = sheet.getUsedRange();
        range.load(["address", "values"]);
        await context.sync();
        const data: any[][] = range.values;
        if (data.length > 1) {
          const labels = data.slice(1).map((row: any[]) => row[0].toString());
          const values = data.slice(1).map((row: any[]) => Number(row[1]));
          const charts = sheet.charts;
          charts.load("items");
          await context.sync();
          if (charts.items.length === 0) {
            message.warning("No charts found to associate with the imported data.");
            return;
          }
          const chart = charts.items[0];
          const dataRange = chart.getDataBodyRange();
          dataRange.load("address");
          await context.sync();
          const associatedRange = dataRange.address.toLowerCase();
          const chartData: ChartData = {
            type: "bar",
            title: "Imported Data",
            labels,
            datasets: [
              {
                label: "Data from Excel",
                data: values,
                backgroundColor: "#4caf50",
              },
            ],
            titleAlignment: "left",
            associatedRange: associatedRange,
            worksheetName: sheet.name,
          };
          addWidgetFunc("chart", chartData);
          message.success("Data imported from Excel successfully.");
        } else {
          message.warning("No data found in the active worksheet.");
        }
      });
    } catch (error) {
      console.error("Error reading data from Excel:", error);
      message.error("Failed to read data from Excel.");
    }
  };
  const readGanttDataFromExcel = async () => {
    console.log(
      `[DashboardProvider] readGanttDataFromExcel => currentDashboardId: ${currentDashboardId}, currentWorkbookId: ${currentWorkbookId}`
    );
    if (!currentDashboardId) {
      console.warn("No current dashboard ID found. Will not save changes to server, but will update local state.");
    }
    if (!currentWorkbookId) {
      console.warn("No workbook ID found. Proceeding without blocking...");
    }
    try {
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheet = context.workbook.worksheets.getItem("Gantt");
        sheet.load("name");
        await context.sync();
        if (sheet.name !== "Gantt") {
          console.log("Not on Gantt sheet. Exiting readGanttDataFromExcel.");
          return;
        }
        const table = sheet.tables.getItemOrNullObject("GanttTable");
        table.load(["name", "dataBodyRange"]);
        await context.sync();
        if (table.isNullObject) {
          message.warning("GanttTable not found on the Gantt worksheet.");
          return;
        }
        const dataBodyRange = table.getDataBodyRange();
        dataBodyRange.load("values");
        await context.sync();
        const data: any[][] = dataBodyRange.values;
        if (!data || data.length === 0) {
          message.warning("No Gantt data found in the GanttTable.");
          return;
        }
        const tasks: Task[] = data
          .map((row: any[]) => {
            const taskName: string = row[0];
            const taskType: string = row[1];
            const startSerial: number = row[2];
            const endSerial: number = row[3];
            const completedSerial: number | "" = row[4];
            const progress: number = row[7];
            const dependenciesRaw: string = row[8];
            if (
              typeof startSerial !== "number" ||
              typeof endSerial !== "number" ||
              (completedSerial !== "" && typeof completedSerial !== "number")
            ) {
              console.warn(`Invalid serial numbers for task: ${taskName}, row`);
              return null;
            }
            const startDate = excelSerialToDateString(startSerial);
            const endDate = excelSerialToDateString(endSerial);
            const completedDate = completedSerial !== "" ? excelSerialToDateString(completedSerial) : undefined;
            const dependencies: string = dependenciesRaw
              ? dependenciesRaw
                  .toString()
                  .split(",")
                  .map((dep: string) => `task-${dep.trim().replace(/\s+/g, "-")}`)
                  .join(",")
              : "";
            let color: string;
            if (progress > 75) {
              color = "#00FF00";
            } else if (progress > 50) {
              color = "#FFFF00";
            } else {
              color = "#FF0000";
            }
            return {
              id: `task-${taskName.replace(/\s+/g, "-")}`,
              name: taskName,
              type: taskType.toLowerCase(),
              start: startDate,
              end: endDate,
              progress: progress,
              dependencies: dependencies,
              color: color,
            } as Task;
          })
          .filter((task): task is Task => task !== null);
        setWidgets((prevWidgets: Widget[]) => {
          const ganttWidget = prevWidgets.find((widget) => widget.type === "gantt");
          let updatedWidgets: Widget[];
          if (ganttWidget) {
            updatedWidgets = prevWidgets.map((widget: Widget) => {
              if (widget.id !== ganttWidget.id) return widget;
              if (widget.type === "gantt") {
                return {
                  ...widget,
                  data: {
                    ...(widget.data as GanttWidgetData),
                    tasks,
                  },
                };
              } else {
                console.warn(`Widget with id ${widget.id} is not a Gantt widget`);
                return widget;
              }
            });
          } else {
            const newGanttWidget: Widget = {
              id: `gantt-${uuidv4()}`,
              type: "gantt",
              data: {
                tasks,
                title: "Gantt Chart",
                titleAlignment: "left",
              } as GanttWidgetData,
            };
            updatedWidgets = [...prevWidgets, newGanttWidget];
            updateLayoutsForNewWidgets([newGanttWidget]);
          }
          return updatedWidgets;
        });
        if (currentDashboardId && currentDashboard) {
          const updatedDashboard = {
            ...currentDashboard,
            components: widgets,
          };
          try {
            await axios.put(`/api/dashboards/${currentDashboard.id}`, updatedDashboard);
            message.success("Gantt chart data loaded from Excel and saved successfully.");
          } catch (err) {
            console.error("Error updating dashboard on server:", err);
            message.error("Failed to update dashboard on server.");
          }
          setCurrentDashboard(updatedDashboard);
        }
      });
    } catch (error) {
      console.error("Error reading Gantt data from Excel:", error);
      message.error("Failed to read Gantt data from Excel.");
    } finally {
      isReadGanttDataInProgress.current = false;
    }
  };
  useEffect(() => {
    const registeredWidgets = new Set<string>();
    let eventResults: OfficeExtension.EventHandlerResult<Excel.WorksheetChangedEventArgs>[] = [];
    const setupMetricEventHandlers = async () => {
      if (!currentDashboard || !currentDashboard.workbookId) {
        return;
      }
      if (currentWorkbookId.toLowerCase() !== currentDashboard.workbookId.toLowerCase()) {
        console.warn("Current workbook does not match the dashboard workbook. Skipping event handler setup.");
        return;
      }
      await Excel.run(async (context) => {
        for (const widget of widgets) {
          if (widget.type === "metric") {
            if (registeredWidgets.has(widget.id)) {
              continue;
            }
            registeredWidgets.add(widget.id);
            const metricData = widget.data as MetricData;
            if (!isValidCellAddress(metricData.cellAddress)) {
              console.warn(`Invalid cell address for widget ${widget.id}: ${metricData.cellAddress}`);
              continue;
            }
            const sheet = context.workbook.worksheets.getItemOrNullObject(metricData.worksheetName);
            sheet.load("name");
            await context.sync();
            if (sheet.isNullObject) {
              console.warn(`Worksheet ${metricData.worksheetName} not found.`);
              continue;
            }
            const range = sheet.getRange(metricData.cellAddress);
            range.load("address");
            await context.sync();
            const eventHandler = async (event: Excel.WorksheetChangedEventArgs) => {
              if (event.address.toLowerCase() === range.address.toLowerCase()) {
                await updateMetricValue(widget.id);
              }
            };
            const eventResult = sheet.onChanged.add(eventHandler);
            eventResults.push(eventResult);
            await updateMetricValue(widget.id);
          }
        }
      }).catch((error) => {
        console.error("Error setting up event handlers:", error);
      });
    };
    setupMetricEventHandlers();
    return () => {
      for (let eventResult of eventResults) {
        eventResult.remove();
      }
      eventResults = [];
    };
  }, [widgets, currentDashboardId, currentWorkbookId]);
  useEffect(() => {
    const setupGanttEventHandlers = async () => {
      console.log("[setupGanttEventHandlers] Checking preconditions...");
      if (!currentDashboard || !currentDashboard.workbookId || !currentWorkbookId) {
        console.log("[setupGanttEventHandlers] Missing currentDashboard or workbookId. Skipping...");
        return;
      }
      if (currentWorkbookId.toLowerCase() !== currentDashboard.workbookId.toLowerCase()) {
        console.warn("[setupGanttEventHandlers] Workbook mismatch. Skipping...");
        return;
      }
      if (isGanttHandlerRegistered.current) {
        console.log("[setupGanttEventHandlers] Gantt handler already registered...");
        return;
      }
      try {
        await Excel.run(async (context: Excel.RequestContext) => {
          console.log("[setupGanttEventHandlers] Starting Excel.run...");
          const sheet = context.workbook.worksheets.getItemOrNullObject("Gantt");
          sheet.load("name");
          await context.sync();
          if (sheet.isNullObject) {
            console.warn("[setupGanttEventHandlers] Gantt worksheet not found. Aborting...");
            return;
          }
          console.log("[setupGanttEventHandlers] Found Gantt worksheet. Adding onChanged event...");
          const eventHandler = async (event: Excel.WorksheetChangedEventArgs) => {
            console.log("[setupGanttEventHandlers] Gantt onChanged event fired!", event.address);
            await readGanttDataFromExcel();
          };
          sheet.onChanged.add(eventHandler);
          ganttEventHandlersRef.current.push(eventHandler);
          isGanttHandlerRegistered.current = true;
          console.log("[setupGanttEventHandlers] Gantt event handler successfully set up.");
        });
      } catch (error) {
        console.error("[setupGanttEventHandlers] Error setting up Gantt event handlers:", error);
      }
    };
    setupGanttEventHandlers();
    return () => {
      const removeGanttEventHandlers = async () => {
        try {
          await Excel.run(async (context: Excel.RequestContext) => {
            const sheet = context.workbook.worksheets.getItemOrNullObject("Gantt");
            sheet.load("name");
            await context.sync();
            if (sheet.isNullObject) {
              console.warn("[setupGanttEventHandlers] Cleanup: Gantt sheet not found.");
              return;
            }
            console.log("[setupGanttEventHandlers] Cleanup: removing onChanged handlers...");
            ganttEventHandlersRef.current.forEach((handler) => {
              sheet.onChanged.remove(handler);
            });
            ganttEventHandlersRef.current = [];
            isGanttHandlerRegistered.current = false;
            console.log("[setupGanttEventHandlers] Cleanup: all Gantt event handlers removed.");
          });
        } catch (error) {
          console.error("[setupGanttEventHandlers] Cleanup: Error removing Gantt handlers:", error);
        }
      };
      removeGanttEventHandlers();
    };
  }, [currentDashboard?.id, currentDashboard?.workbookId, currentWorkbookId]);
  const isValidCellAddress = (address: string) => {
    const cellAddressRegex = /^[A-Za-z]{1,3}[1-9][0-9]{0,6}$/;
    return cellAddressRegex.test(address);
  };
  const addTaskToGantt = async (newTask: Task) => {
    console.log(`[DashboardProvider] addTaskToGantt => ID: ${currentDashboardId}, workbookId: ${currentWorkbookId}`);
    if (!currentWorkbookId) {
      message.error("No workbook ID found. Please open or re-open the correct workbook.");
      return;
    }
    if (!currentDashboardId) {
      console.warn(
        "No current dashboard ID found. The task will be added locally and to Excel, but not saved to server yet."
      );
    }
    if (!newTask.name || !newTask.type || !newTask.start || !newTask.end) {
      message.error("Task is missing required fields.");
      return;
    }
    try {
      let updatedWidgets: Widget[] = [];
      setWidgets((prevWidgets: Widget[]) => {
        updatedWidgets = prevWidgets.map((widget: Widget) => {
          if (widget.type === "gantt") {
            const ganttData = widget.data as GanttWidgetData;
            return {
              ...widget,
              data: {
                ...ganttData,
                tasks: [...ganttData.tasks, newTask],
              },
            };
          }
          return widget;
        });
        const ganttExists = updatedWidgets.some((w) => w.type === "gantt");
        if (!ganttExists) {
          const newGanttWidget: Widget = {
            id: `gantt-${uuidv4()}`,
            type: "gantt",
            data: {
              tasks: [newTask],
              title: "Gantt Chart",
              titleAlignment: "left",
            },
          };
          updatedWidgets.push(newGanttWidget);
          updateLayoutsForNewWidgets([newGanttWidget]);
        }
        return updatedWidgets;
      });
      await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getItemOrNullObject("Gantt");
        sheet.load("name");
        await context.sync();
        if (sheet.isNullObject) {
          message.error("Gantt sheet not found. Make sure you inserted the template first.");
          return;
        }
        const table = sheet.tables.getItemOrNullObject("GanttTable");
        table.load(["name"]);
        await context.sync();
        if (table.isNullObject) {
          message.error("GanttTable not found in the Gantt worksheet.");
          return;
        }
        let dependenciesValue = "";
        if (Array.isArray(newTask.dependencies)) {
          dependenciesValue = newTask.dependencies.join(", ");
        } else if (typeof newTask.dependencies === "string") {
          dependenciesValue = newTask.dependencies;
        }
        const durationValue = newTask.duration ?? "";
        const capitalizedType = newTask.type ? newTask.type.charAt(0).toUpperCase() + newTask.type.slice(1) : "Task";
        const rowData: (string | number | boolean)[] = [
          newTask.name,
          capitalizedType,
          newTask.start,
          newTask.end,
          newTask.completed ?? "",
          durationValue,
          "",
          newTask.progress || 0,
          dependenciesValue,
        ];
        table.rows.add(undefined, [rowData]);
        await context.sync();
      });
      if (currentDashboardId && currentDashboard) {
        const updatedDashboard = {
          ...currentDashboard,
          components: updatedWidgets,
        };
        try {
          await axios.put(`/api/dashboards/${currentDashboard.id}`, updatedDashboard);
          message.success("Task added successfully and synced to Excel and server!");
        } catch (err) {
          console.error("Error updating dashboard on server:", err);
          message.error("Failed to update dashboard on server.");
        }
        setCurrentDashboard(updatedDashboard);
      }
    } catch (error) {
      console.error("Error adding task to Gantt widget and Excel:", error);
      if (error instanceof OfficeExtension.Error) {
        message.error(`Office.js Error: ${error.code} - ${error.message}`);
      } else {
        message.error("Failed to add task to Gantt widget and Excel.");
      }
    }
  };
  const updateDashboardTitle = (id: string, newTitle: string) => {
    setDashboards((prev) => prev.map((dash) => (dash.id === id ? { ...dash, title: newTitle } : dash)));
  };
  const updateMetricValue = async (widgetId: string) => {
    try {
      console.log(`Updating metric value for widget ID: ${widgetId}`);
      await Excel.run(async (context) => {
        const widgetIndex = widgets.findIndex((w) => w.id === widgetId);
        if (widgetIndex !== -1 && widgets[widgetIndex].type === "metric") {
          const metricData = widgets[widgetIndex].data as MetricData;
          if (!isValidCellAddress(metricData.cellAddress)) {
            console.warn(`Invalid cell address for widget ${widgetId}: ${metricData.cellAddress}`);
            message.error("Invalid cell address specified for the metric widget.");
            return;
          }
          console.log(`Fetching value from ${metricData.worksheetName}!${metricData.cellAddress}`);
          const sheet = context.workbook.worksheets.getItem(metricData.worksheetName);
          const range = sheet.getRange(metricData.cellAddress);
          range.load("values");
          await context.sync();
          const cellValue = range.values[0][0];
          console.log(`Retrieved cell value: ${cellValue}`);
          const newValue = parseFloat(cellValue);
          console.log(`Parsed new value: ${newValue}`);
          if (isNaN(newValue)) {
            console.warn(`The value in ${metricData.worksheetName}!${metricData.cellAddress} is not a number.`);
            message.warning(
              `The value in ${metricData.worksheetName}!${metricData.cellAddress} is not a valid number.`
            );
            return;
          }
          if (metricData.currentValue === newValue) {
            console.log("Metric value has not changed, skipping update.");
            return;
          }
          updateWidgetsWithHistory((prevWidgets) => {
            return prevWidgets.map((widget) => {
              if (widget.id === widgetId && widget.type === "metric") {
                return {
                  ...widget,
                  data: {
                    ...widget.data,
                    currentValue: newValue,
                  } as MetricData,
                };
              }
              return widget;
            });
          });
        } else {
          console.warn(`Widget with ID ${widgetId} not found or is not a metric widget.`);
        }
      });
    } catch (error) {
      console.error("Error updating metric value:", error);
      message.error("Failed to update metric value. Please ensure the cell address is valid.");
    }
  };
  const exportDashboardAsPDF = async (): Promise<void> => {
    const container = document.getElementById("dashboard-container");
    if (!container) {
      message.error("Dashboard container not found.");
      return;
    }
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const containerWidth = container.scrollWidth + 5;
      const containerHeight = container.scrollHeight + 5;
      const canvas = await html2canvas(container, {
        useCORS: true,
        backgroundColor: "#FFF",
        width: containerWidth,
        height: containerHeight,
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const margin = 20;
      const canvasWidthPx = canvas.width;
      const canvasHeightPx = canvas.height;
      const pdf = new jsPDF("p", "pt", [canvasWidthPx + margin * 2, canvasHeightPx + margin * 2]);
      pdf.addImage(imgData, "PNG", margin, margin, canvasWidthPx, canvasHeightPx);
      pdf.save("dashboard.pdf");
      message.success("Dashboard exported as PDF successfully!");
    } catch (error) {
      console.error("Error exporting dashboard as PDF:", error);
      message.error("Failed to export dashboard as PDF.");
    }
  };
  const emailDashboard = () => {
    exportDashboardAsPDF()
      .then(() => {
        const mailtoLink = `mailto:?subject=Dashboard&body=Please find the attached dashboard.`;
        window.location.href = mailtoLink;
        message.info("Please attach the downloaded PDF to your email.");
      })
      .catch((error) => {
        console.error("Error exporting dashboard as PDF:", error);
        message.error("Failed to export dashboard as PDF.");
      });
  };
  const applyDataValidation = async () => {
    try {
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const taskTypeRange = sheet.getRange("B2:B100");
        const dependenciesRange = sheet.getRange("I2:I100");
        const taskTypeOptions = ["Task", "Milestone", "Project"];
        const taskTypeValues = taskTypeOptions.join(",");
        applyListDataValidation(
          taskTypeRange,
          taskTypeValues,
          `Please select a valid Task Type: ${taskTypeOptions.join(", ")}`,
          "Invalid Task Type",
          "Select a Task Type from the dropdown.",
          "Task Type"
        );
        console.log("Data validation applied to Task Type column");
        applyListDataValidation(
          dependenciesRange,
          "=TaskNames",
          "Please select a valid Task Name from the dropdown.",
          "Invalid Dependency",
          "Select a Task Name from the dropdown.",
          "Dependencies"
        );
        console.log("Data validation applied to Dependencies column");
        await context.sync();
        message.success("Data validation applied successfully!");
      });
    } catch (error) {
      if (error instanceof OfficeExtension.Error) {
        console.error(`Office.js Error: ${error.code} - ${error.message}`);
      } else {
        console.error("Unexpected Error:", error);
      }
      message.error("Failed to apply data validation.");
    }
  };
  return (
    <DashboardContext.Provider
      value={{
        widgets,
        dashboards,
        addWidget: addWidgetFunc,
        removeWidget: removeWidgetFunc,
        updateWidget: updateWidgetFunc,
        copyWidget,
        importChartImageFromExcel,
        readDataFromExcel,
        readGanttDataFromExcel,
        generateProjectManagementTemplateAndGanttChart,
        insertProjectManagementTemplate: insertProjectManagementTemplate,
        saveAsTemplate,
        layouts,
        setLayouts,
        exportDashboardAsPDF,
        emailDashboard,
        currentDashboardId,
        dashboardBorderSettings,
        setDashboardBorderSettings,
        setCurrentDashboardId,
        dashboardTitle,
        setDashboardTitle,
        availableWorksheets,
        setAvailableWorksheets,
        setWidgets,
        setDashboards,
        saveDashboardVersion,
        restoreDashboardVersion,
        editDashboard,
        selectedRangeAddress,
        setSelectedRangeAddress,
        isFullscreenActive,
        setIsFullscreenActive,
        refreshTableWidgetData,
        updateDashboardTitle,
        deleteDashboard,
        undo,
        redo,
        canUndo,
        canRedo,
        currentDashboard,
        setCurrentDashboard,
        currentTemplateId,
        getWorkbookIdFromProperties: async () => currentWorkbookId,
        setCurrentTemplateId,
        getAvailableTables,
        applyDataValidation,
        refreshAllCharts,
        updateLayoutsForNewWidgets,
        isFetching,
        setIsFetching,
        addTaskToGantt,
        currentWorkbookId,
        setCurrentWorkbookId,
        userEmail,
        setUserEmail,
        writeMetricValue,
        promptForWidgetDetails: (widget: Widget, onComplete: (updatedWidget: Widget) => void) => {
          setWidgetToPrompt({ widget, onComplete });
        },
      }}
    >
      {children}
      {widgetToPrompt && widgetToPrompt.widget.type !== "table" && (
        <PromptWidgetDetailsModal
          widget={widgetToPrompt.widget}
          onComplete={(updatedWidget) => {
            handleWidgetDetailsComplete(updatedWidget);
          }}
          onCancel={() => setWidgetToPrompt(null)}
        />
      )}
      <SelectTableModal
        visible={isSelectTableModalVisible && widgetToPrompt?.widget.type === "table"}
        widget={widgetToPrompt?.widget as TableWidget}
        onComplete={(updatedWidget: TableWidget) => {
          handleWidgetDetailsComplete(updatedWidget);
        }}
        onCancel={() => {
          setIsSelectTableModalVisible(false);
          setWidgetToPrompt(null);
        }}
      />
    </DashboardContext.Provider>
  );
};
