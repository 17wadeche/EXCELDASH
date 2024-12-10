/// <reference types="office-js" />
// src/taskpane/context/DashboardContext.tsx
import React, { createContext, useState, useEffect, useCallback, useRef} from 'react';
import { Widget, TextData, ChartData, GanttWidgetData, ImageWidgetData, TitleWidgetData, TitleWidget, ReportData, DashboardVersion, GridLayoutItem, DashboardItem, ReportItem, LineWidgetData, MetricData, Task} from '../components/types';
import { v4 as uuidv4 } from 'uuid';
import { Breakpoint, GRID_COLS, WIDGET_SIZES } from '../components/layoutConstants';
import { message, Select } from 'antd';
import html2canvas from 'html2canvas';
import SalesChart from '../components/widgets/SalesChart';
import isEqual from 'lodash.isequal'
import jsPDF from 'jspdf';
import PromptWidgetDetailsModal from '../components/PromptWidgetDetailsModal';
import { DashboardBorderSettings } from '../components/types';
import TitleWidgetComponent from '../components/TitleWidget';
import { capitalizeFirstLetter } from '../utils/stringUtils'; 

const { Option } = Select;
interface DashboardContextProps {
  widgets: Widget[];
  dashboards: DashboardItem[];
  addWidget: (type: 'title' | 'text' | 'chart' | 'gantt' | 'image' | 'metric' | 'report' | 'line' , data?: any) => void;
  removeWidget: (id: string) => void;
  updateWidget: (
    id: string,
    updatedData: Partial< TitleWidgetData | TextData | ChartData | GanttWidgetData | ImageWidgetData | ReportData | MetricData | LineWidgetData>
  ) => void;
  copyWidget: (widget: Widget) => void;
  importChartImageFromExcel: () => void;
  readDataFromExcel: () => void;
  readGanttDataFromExcel: () => void;
  setReports: React.Dispatch<React.SetStateAction<ReportItem[]>>;
  selectedRangeAddress: string | null;
  setSelectedRangeAddress: (address: string | null) => void;
  generateProjectManagementTemplateAndGanttChart: () => void;
  insertProjectManagementTemplate: () => void;
  saveAsTemplate: () => void;
  isFullscreenActive: boolean;
  setIsFullscreenActive: React.Dispatch<React.SetStateAction<boolean>>;
  currentDashboardId: string | null;
  setCurrentDashboardId: (id: string | null) => void;
  saveTemplate: () => void;
  setCurrentWorkbookId: (id: string | undefined) => void;
  currentDashboard: DashboardItem | null;
  addTaskToGantt: (task: Task) => Promise<void>;
  setCurrentDashboard: (dashboard: DashboardItem | null) => void;
  updateLayoutsForNewWidgets: (widgets: Widget[]) => void;
  currentWorkbookId: string | undefined;
  exportDashboardAsPDF: () => Promise<void>;
  emailDashboard: () => void;
  dashboardTitle: string;
  setDashboardTitle: (title: string) => void;
  availableWorksheets: string[];
  setAvailableWorksheets: React.Dispatch<React.SetStateAction<string[]>>;
  setWidgets: (widgets: Widget[]) => void;
  addDashboard: (dashboard: DashboardItem) => void;
  saveDashboardVersion: () => void;
  restoreDashboardVersion: (versionId: string) => void;
  promptForWidgetDetails: ( widget: Widget, onComplete: (updatedWidget: Widget) => void) => void;
  editDashboard: (dashboard: DashboardItem) => void;
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
  applyDataValidation: () => void;
  dashboardBorderSettings: DashboardBorderSettings;
  setDashboardBorderSettings: React.Dispatch<React.SetStateAction<DashboardBorderSettings>>;
  refreshAllCharts: () => void;
  reports: ReportItem[];
  addReport: (report: ReportItem) => void;
  editReport: (report: ReportItem) => void;
  deleteReport: (id: string) => void;
}
interface DashboardProviderProps {
  children: React.ReactNode;
  initialWidgets?: Widget[];
  initialLayouts?: { [key: string]: GridLayoutItem[] };
  initialWorkbookId?: string | null;
  initialAvailableWorksheets?: string[];
}
export const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);
export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children, initialWidgets = [], initialLayouts = {}, initialWorkbookId = null, initialAvailableWorksheets = [] }) => {
  const defaultTitleWidget: Widget = {
    id: 'dashboard-title',
    type: 'title',
    data: {
      content: 'Your Dashboard Title',
      fontSize: 24,
      textColor: '#000000',
      backgroundColor: '#ffffff',
      titleAlignment: 'center',
    } as TitleWidgetData,
  };
  const [widgets, setWidgets] = useState<Widget[]>(
    initialWidgets && initialWidgets.length > 0 ? initialWidgets : [defaultTitleWidget]
  );
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [dashboardTitle, setDashboardTitle] = useState<string>('My Dashboard');
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState<DashboardItem | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [widgetToPrompt, setWidgetToPrompt] = useState<{
    widget: Widget;
    onComplete: (updatedWidget: Widget) => void;
  } | null>(null);
  const [isChartSelectionModalVisible, setIsChartSelectionModalVisible] = useState(false);
  const [availableCharts, setAvailableCharts] = useState<{ key: number; name: string }[]>([]);
  const [layouts, setLayouts] = useState<{ [key: string]: GridLayoutItem[] }>(initialLayouts);
  const [currentWorkbookId, setCurrentWorkbookId] = useState<string | undefined>(
    initialWorkbookId ?? undefined
  );
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [pastStates, setPastStates] = useState<
  { widgets: Widget[]; layouts: { [key: string]: GridLayoutItem[] } }[]
  >([]);
  const [futureStates, setFutureStates] = useState<
    { widgets: Widget[]; layouts: { [key: string]: GridLayoutItem[] } }[]
  >([]);
  const [availableWorksheets, setAvailableWorksheets] = useState<string[]>([]);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [ganttEventHandlers, setGanttEventHandlers] = useState<((event: Excel.WorksheetChangedEventArgs) => Promise<void>)[]>([]);
  const ganttEventHandlersRef = useRef<((event: Excel.WorksheetChangedEventArgs) => Promise<void>)[]>([]);
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(null);
  const [selectedRangeAddress, setSelectedRangeAddress] = useState<string | null>(null);
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  useEffect(() => {
    const updateCurrentDashboard = () => {
      const dashboard = dashboards.find((d) => d.id === currentDashboardId);
      if (dashboard) {
        if (dashboard.workbookId === currentWorkbookId) {
          if (!isEqual(dashboard, currentDashboard)) {
            setCurrentDashboard(dashboard);
            if (!isEqual(dashboard.components, widgets)) {
              setWidgets(dashboard.components);
            }
            if (!isEqual(dashboard.layouts || {}, layouts)) {
              setLayouts(dashboard.layouts || {});
            }
            if (dashboard.title !== dashboardTitle) {
              setDashboardTitle(dashboard.title || 'My Dashboard');
            }
            if (dashboard.layouts && Object.keys(dashboard.layouts).length > 0 && !isEqual(dashboard.layouts, layouts)) {
              setLayouts(dashboard.layouts);
            } else {
              updateLayoutsForNewWidgets(dashboard.components);
            }
          }
        } else {
          message.warning('The selected dashboard is not associated with the currently open workbook.');
          resetDashboard();
        }
      } else {
        resetDashboard();
      }
    };
    updateCurrentDashboard();
  }, [currentDashboardId, dashboards, currentWorkbookId]);
  const isUndoRedoRef = useRef(false);
  const isInitialRender = useRef(true);
  
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
    }
  }, [widgets, layouts]);

  const resetDashboard = () => {
    setCurrentDashboard(null);
    setWidgets([defaultTitleWidget]);
    setLayouts({});
    setDashboardTitle('My Dashboard');
    console.log('Dashboard reset to default.');
  };

  useEffect(() => {
    if (
      currentDashboard &&
      currentDashboard.layouts &&
      Object.keys(currentDashboard.layouts).length > 0 &&
      !isEqual(layouts, currentDashboard.layouts)
    ) {
      setLayouts(currentDashboard.layouts);
    }
  }, [currentDashboard]);
  
  const setDefaultLayouts = () => {
    const newLayouts = { ...initialLayouts };
    ['lg', 'md', 'sm'].forEach((breakpoint) => {
      const breakpointCols = GRID_COLS[breakpoint as Breakpoint];
      let y = 0;
      newLayouts[breakpoint] = widgets.map((widget) => {
        const size = WIDGET_SIZES[widget.type] || { w: 8, h: 4 };
        let x = widget.type === 'title' ? Math.floor((breakpointCols - size.w) / 2) : 0;
        const layoutItem: GridLayoutItem = {
          i: widget.id,
          x,
          y,
          w: size.w,
          h: size.h,
          minW: 1,
          minH: 1,
        };
        y += size.h;
        return layoutItem;
      });
    });
    setLayouts(newLayouts);
    console.log('Default layouts set.');
  };

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
        sheet.load('name');
        await context.sync();
        if (sheet.isNullObject) {
          message.error(`Worksheet "${worksheetName}" not found.`);
          return;
        }
        const range = sheet.getRange(cellAddress);
        range.values = [[newValue]];
        await context.sync();
        console.log(`Setting widget ${widgetId} currentValue to ${newValue}`);
        setWidgets((prevWidgets) =>
          prevWidgets.map((widget) =>
            widget.id === widgetId && widget.type === 'metric'
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
        message.success('Metric value updated successfully!');
      });
    } catch (error) {
      console.error('Error writing metric value:', error);
      if (error instanceof OfficeExtension.Error) {
        message.error(`Office.js Error: ${error.code} - ${error.message}`);
      } else {
        message.error('Failed to update metric value.');
      }
    }
  };
  const promptForWidgetDetails = useCallback(
    (widget: Widget, onComplete: (updatedWidget: Widget) => void) => {
      setWidgetToPrompt({ widget, onComplete });
    },
    []
  );

  const [dashboardBorderSettings, setDashboardBorderSettings] = useState<DashboardBorderSettings>(
    () => {
      const storedSettings = localStorage.getItem('dashboardBorderSettings');
      return storedSettings
        ? JSON.parse(storedSettings)
        : {
            showBorder: false,
            color: '#000000',
            thickness: 1,
            style: 'solid',
          };
    }
  );

  useEffect(() => {
    localStorage.setItem('dashboardBorderSettings', JSON.stringify(dashboardBorderSettings));
  }, [dashboardBorderSettings]);

  const handleWidgetDetailsComplete = (updatedWidget: Widget) => {
    if (!widgetToPrompt) {
      console.warn('widgetToPrompt is null.');
      return;
    }
    const { widget, onComplete } = widgetToPrompt;
    updateWidgetsWithHistory((prevWidgets) => {
      const newWidgets = prevWidgets.map((w) => (w.id === widget.id ? updatedWidget : w));
      localStorage.setItem('widgets', JSON.stringify(newWidgets));
      return newWidgets;
    });
    onComplete(updatedWidget);
    setWidgetToPrompt(null);
  };

  useEffect(() => {
    if (!initialAvailableWorksheets.length) {
      const fetchSheets = async () => {
        const sheets = await getAvailableWorksheets();
        setAvailableWorksheets(sheets);
      };
      fetchSheets();
    } else {
      setAvailableWorksheets(initialAvailableWorksheets);
    }
  }, []);

  useEffect(() => {
    const initializeDashboards = async () => {
      const storedDashboards: DashboardItem[] = JSON.parse(localStorage.getItem('dashboards') || '[]');
      const migratedDashboards = [...storedDashboards];
      let workbookId = await getWorkbookIdFromProperties();
      if (!workbookId) {
        workbookId = uuidv4();
        await setWorkbookIdInProperties(workbookId);
      }
      setCurrentWorkbookId(workbookId);
      migratedDashboards.forEach((dashboard) => {
        if (!dashboard.workbookId) {
          dashboard.workbookId = workbookId;
        }
      });
      setDashboards(migratedDashboards);
      const storedCurrentDashboardId = localStorage.getItem('currentDashboardId') || null;
      if (storedCurrentDashboardId) {
        const dashboard = migratedDashboards.find((d) => d.id === storedCurrentDashboardId);
        if (dashboard) {
          setCurrentDashboardId(dashboard.id);
          setCurrentDashboard(dashboard);
          setWidgets(dashboard.components);
          const validLayouts = fixInvalidLayouts(dashboard.layouts || {}, dashboard.components);
          setLayouts(validLayouts);
          setDashboardTitle(dashboard.title || 'My Dashboard');
          return;
        }
      }
      const matchingDashboard = migratedDashboards.find(
        (dashboard) => dashboard.workbookId === workbookId
      );
      if (matchingDashboard) {
        setCurrentDashboardId(matchingDashboard.id);
        setCurrentDashboard(matchingDashboard);
        setWidgets(matchingDashboard.components);
        const validLayouts = fixInvalidLayouts(matchingDashboard.layouts || {}, matchingDashboard.components);
        if (Object.keys(validLayouts).length === 0) {
          updateLayoutsForNewWidgets(matchingDashboard.components);
        } else {
          setLayouts(validLayouts);
        }
        setDashboardTitle(matchingDashboard.title || 'My Dashboard');
      } else {
        setCurrentDashboard(null);
        setWidgets([defaultTitleWidget]);
        setLayouts({});
        setDashboardTitle('My Dashboard');
        console.log('Dashboard reset to default.');
      }
    };
    initializeDashboards();
  }, []);

  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (currentDashboard) {
        const updatedDashboards = dashboards.map((dashboard) =>
          dashboard.id === currentDashboard.id
            ? { ...currentDashboard, components: widgets, layouts, title: dashboardTitle }
            : dashboard
        );
        setDashboards(updatedDashboards);
        localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
        console.log('Autosaved at', new Date().toLocaleTimeString());
      }
    }, 2 * 60 * 1000);
    return () => {
      clearInterval(autosaveInterval);
    };
  }, [widgets, layouts, dashboardTitle, currentDashboard, dashboards]);

  useEffect(() => {
    const initializeReports = async () => {
      const storedReports = JSON.parse(localStorage.getItem('reports') || '[]');
      const currentWorkbookId = await getWorkbookIdFromProperties();
      const workbookReports = storedReports.filter(
        (report: ReportItem) => report.workbookId === currentWorkbookId
      );
      setReports(workbookReports || []);
    };
    initializeReports();
  }, []);

  useEffect(() => {
    if (!initialWorkbookId) {
      const initializeWorkbookId = async () => {
        const workbookId = await getWorkbookIdFromProperties();
        setCurrentWorkbookId(workbookId);
      };
      initializeWorkbookId();
    } else {
      setCurrentWorkbookId(initialWorkbookId);
    }
  }, []);

  const isInDialog = (): boolean => {
    return !!Office?.context?.ui?.messageParent;
  };

  const getAvailableWorksheets = async (): Promise<string[]> => {
    if (isInDialog()) {
      console.log('Running in dialog; skipping getAvailableWorksheets.');
      return [];
    }
  
    try {
      return await Excel.run(async (context: Excel.RequestContext) => {
        const sheets = context.workbook.worksheets;
        sheets.load("items/name");
        await context.sync();
        return sheets.items.map(sheet => sheet.name);
      });
    } catch (error) {
      console.error("Error fetching worksheets:", error);
      message.error("Failed to fetch worksheets from Excel.");
      return [];
    }
  };

  const addReport = (report: ReportItem) => {
    const updatedReports = [...reports, report];
    setReports(updatedReports);
    localStorage.setItem('reports', JSON.stringify(updatedReports));
  };
  const editReport = (report: ReportItem) => {
    const updatedReports = reports.map((r) => (r.id === report.id ? report : r));
    setReports(updatedReports);
    localStorage.setItem('reports', JSON.stringify(updatedReports));
  };
  const deleteReport = (id: string) => {
    const updatedReports = reports.filter((r) => r.id !== id);
    setReports(updatedReports);
    localStorage.setItem('reports', JSON.stringify(updatedReports));
  };
  useEffect(() => {
    const storedWidgets = JSON.parse(localStorage.getItem('widgets') || '[]');
    const needsMigration = storedWidgets.some(
      (widget: Widget) => (widget.type === 'chart' || widget.type === 'image') && 'chartIndex' in widget.data
    );
    if (needsMigration) {
      migrateChartIndexToAssociatedRange();
    } else {
      const updatedWidgets = storedWidgets.map((widget: any) => {
        switch (widget.type) {
          case 'image': {
            const imageData: ImageWidgetData = {
              src: widget.data.src || '',
            };
            return { ...widget, data: imageData };
          }
          case 'chart': {
            const chartData: ChartData = {
              type: widget.data.type || 'bar',
              title: widget.data.title || 'Sample Chart',
              labels: widget.data.labels || [],
              datasets: widget.data.datasets || [],
              titleAlignment: widget.data.titleAlignment || 'left',
              associatedRange: widget.data.associatedRange || '',
              worksheetName: widget.data.worksheetName || '',
            };
            return { ...widget, data: chartData };
          }
          case 'metric': {
            const metricData: MetricData = {
              cellAddress: widget.data.cellAddress || '',
              worksheetName: widget.data.worksheetName || '',
              targetValue: widget.data.targetValue ?? 0,
              comparison: widget.data.comparison || 'greater',
              fontSize: widget.data.fontSize ?? 28,
              displayName: widget.data.displayName || 'KPI',
              format: widget.data.format || 'number',
              currentValue: widget.data.currentValue ?? 0,
              titleAlignment: widget.data.titleAlignment || 'left',
              backgroundColor: '#ffffff',
              textColor: '#000000',
            };
            return { ...widget, data: metricData };
          }
          case 'text': {
            const textData: TextData = {
              content: widget.data.content || 'Your Dashboard Title',
              fontSize: widget.data.fontSize ?? 24,
              textColor: widget.data.textColor || '#000000',
              backgroundColor: widget.data.backgroundColor || '#ffffff',
              titleAlignment: widget.data.titleAlignment || 'left',
            };
            return { ...widget, data: textData };
          }
          case 'gantt': {
            const ganttData: GanttWidgetData = {
              tasks: widget.data.tasks || [],
              title: widget.data.title || 'Gantt Chart',
              titleAlignment: widget.data.titleAlignment || 'left',
            };
            return { ...widget, data: ganttData };
          }
          case 'report': {
            const reportData: ReportData = {
              columns: widget.data.columns || [],
              data: widget.data.data || [],
            };
            return { ...widget, data: reportData };
          }
          default:
            console.warn(`Unknown widget type: ${widget.type}. Widget will be skipped.`);
            return null;
        }
      }).filter((widget: Widget | null) => widget !== null);
      if (!updatedWidgets.some((w: Widget) => w.type === 'title')) {
        updatedWidgets.unshift(defaultTitleWidget);
      }
      setWidgets(updatedWidgets);
    }
  }, []);

  const saveAsTemplate = () => {
    const template = {
      id: uuidv4(),
      name: dashboardTitle || 'Untitled Template',
      widgets: widgets,
      layouts: layouts,
    };
    const storedTemplates = JSON.parse(localStorage.getItem('dashboardTemplates') || '[]');
    storedTemplates.push(template);
    localStorage.setItem('dashboardTemplates', JSON.stringify(storedTemplates));
    message.success('Dashboard saved as template!');
  };
  
  const saveTemplate = () => {
    if (!currentDashboardId) {
      message.warning('No dashboard is currently active.');
      return;
    }
    const storedDashboards = JSON.parse(localStorage.getItem('dashboards') || '[]');
    const updatedDashboards = storedDashboards.map((dashboard: DashboardItem) => {
      if (dashboard.id === currentDashboardId) {
        return {
          ...dashboard,
          title: dashboardTitle,
          components: widgets,
          layouts: layouts,
        };
      }
      return dashboard;
    });
    localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
    setDashboards(updatedDashboards);
    message.success('Dashboard saved successfully!');
  };
  enum ReferenceStyle {
    a1 = 0,
    r1c1 = 1,
  }

  const excelSerialToDateString = (serial: number): string => {
    if (typeof serial !== 'number' || isNaN(serial)) {
      console.warn('Invalid serial number:', serial);
      return '';
    }
    const date = new Date((serial - 25569) * 86400000);
    return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
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
        const sheetName = 'Gantt';
        let sheet = context.workbook.worksheets.getItemOrNullObject(sheetName);
        await context.sync();
        if (sheet.isNullObject) {
          sheet = context.workbook.worksheets.add(sheetName);
        } else {
          sheet.getRange().clear();
        }
        sheet.activate();
        await context.sync();
        const existingTable = sheet.tables.getItemOrNullObject('GanttTable');
        existingTable.load('name');
        await context.sync();
        if (!existingTable.isNullObject) {
          existingTable.delete();
          await context.sync();
          console.log('Existing GanttTable deleted.');
        }
        const entireSheet = sheet.getRange();
        entireSheet.clear(Excel.ClearApplyTo.all);
        await context.sync();
        console.log('Worksheet cleared.');
        const headers = [
          'Task Name',
          'Task Type',
          'Start Date',
          'End Date',
          'Completed Date',
          'Duration (Days)',
          'Actual Duration (Days)',
          'Progress %',
          'Dependencies',
        ];
        const headerRange = sheet.getRange('A1:I1');
        headerRange.values = [headers];
        headerRange.format.font.bold = true;
        headerRange.format.fill.color = '#4472C4'; // Blue background
        headerRange.format.font.color = 'white'; // White text
        console.log('Headers inserted on A1:I1:', headers);
        const columnWidths = [25, 15, 15, 15, 15, 18, 22, 12, 20];
        columnWidths.forEach((width, index) => {
          const columnLetter = String.fromCharCode(65 + index); // 65 is 'A'
          sheet.getRange(`${columnLetter}:${columnLetter}`).columnWidth = width;
        });
        console.log('Column widths set:', columnWidths);
        const parseDate = (dateString: string): Date => {
          const [month, day, year] = dateString.split('/').map(Number);
          return new Date(year, month - 1, day);
        };
        const dateToExcelSerial = (date: Date): number => {
          return date.getTime() / 86400000 + 25569;
        };
        const calculateDuration = (start: Date, end: Date): number => {
          const diffInMillis = end.getTime() - start.getTime();
          return Math.round(diffInMillis / (1000 * 60 * 60 * 24));
        };
        const sampleData = [
          [
            'Design Interface',
            'Task',
            dateToExcelSerial(parseDate('01/01/2023')),
            dateToExcelSerial(parseDate('01/09/2023')),
            dateToExcelSerial(parseDate('01/10/2023')),
            '=D2-C2',
            '=E2-C2',
            50, 
            '',
          ],
          [
            'Develop Backend',
            'Task',
            dateToExcelSerial(parseDate('01/05/2023')),
            dateToExcelSerial(parseDate('01/19/2023')),
            '', 
            '=D3-C3',
            '=E3-C3',
            30, 
            'Design Interface',
          ],
          [
            'Testing',
            'Task',
            dateToExcelSerial(parseDate('01/15/2023')),
            dateToExcelSerial(parseDate('01/24/2023')),
            '', 
            '=D4-C4',
            '=E4-C4',
            0, 
            'Develop Backend',
          ],
          [
            'Deployment',
            'Milestone',
            dateToExcelSerial(parseDate('01/30/2023')),
            dateToExcelSerial(parseDate('01/30/2023')),
            dateToExcelSerial(parseDate('01/30/2023')),
            '=D5-C5',
            '=E5-C5',
            0, 
            'Testing',
          ],
          [
            'Project Complete',
            'Project',
            dateToExcelSerial(parseDate('01/01/2023')),
            dateToExcelSerial(parseDate('01/29/2023')),
            dateToExcelSerial(parseDate('01/30/2023')),
            '=D6-C6',
            '=E6-C6',
            100,
            '',
          ],
        ];
        const dataRowStart = 2;
        const dataRowEnd = dataRowStart + sampleData.length - 1; 
        const dataRangeAddress = `A${dataRowStart}:I${dataRowEnd}`;
        const dataRange = sheet.getRange(dataRangeAddress);
        dataRange.values = sampleData;
        console.log('Sample data inserted on A2:I6:', sampleData);
        const dateColumns = ['C', 'D', 'E'];
        dateColumns.forEach((col) => {
          const range = sheet.getRange(`${col}${dataRowStart}:${col}${dataRowEnd}`);
          range.numberFormat = [['mm/dd/yyyy']];
        });
        console.log('Date columns formatted as mm/dd/yyyy');
        const durationColumns = ['F', 'G'];
        durationColumns.forEach((col) => {
          const range = sheet.getRange(`${col}${dataRowStart}:${col}${dataRowEnd}`);
          range.numberFormat = [['0']];
        });
        console.log('Duration columns formatted as integers');
        const progressRange = sheet.getRange(`H${dataRowStart}:H${dataRowEnd}`);
        const progressFormat = '0'; 
        const progressFormats = Array.from({ length: dataRowEnd - dataRowStart + 1 }, () => [progressFormat]);
        progressRange.numberFormat = progressFormats;
        console.log('Progress column formatted as number');
        try {
          const table = sheet.tables.add(`A1:I${dataRowEnd}`, true); 
          table.name = 'GanttTable';
          console.log('GanttTable created successfully.');
        } catch (tableError) {
          console.error('Failed to create GanttTable:', tableError);
          throw tableError; 
        }
        const taskNamesRangeName = 'TaskNames';
        const taskNamesRangeAddress = `A${dataRowStart}:A${dataRowEnd}`; 
        const taskNamesRange = sheet.getRange(taskNamesRangeAddress);
        taskNamesRange.load('values'); 
        const existingNamedRange = context.workbook.names.getItemOrNullObject(taskNamesRangeName);
        await context.sync();
        if (!existingNamedRange.isNullObject) {
          existingNamedRange.delete();
          await context.sync();
          console.log(`Existing named range '${taskNamesRangeName}' deleted.`);
        }
        try {
          context.workbook.names.add(taskNamesRangeName, taskNamesRange);
          console.log(`Named range '${taskNamesRangeName}' created for range ${taskNamesRangeAddress}`);
        } catch (nameError) {
          console.error(`Error creating named range '${taskNamesRangeName}':`, nameError);
          throw nameError;
        }
        const taskTypeOptions = ['Task', 'Milestone', 'Project'];
        const taskTypeValues = taskTypeOptions.join(',');
        const taskTypeRangeAddress = `B${dataRowStart}:B${dataRowEnd}`;
        const taskTypeRange = sheet.getRange(taskTypeRangeAddress);
        applyListDataValidation(
          taskTypeRange,
          taskTypeValues,
          `Please select a valid Task Type: ${taskTypeOptions.join(', ')}`,
          'Invalid Task Type',
          'Select a Task Type from the dropdown.',
          'Task Type'
        );
        taskTypeRange.dataValidation.load(['rule', 'errorAlert', 'prompt']);
        await context.sync();
        console.log(`Data validation for Task Type applied to range ${taskTypeRangeAddress}`);
        const dependenciesRangeAddress = `I${dataRowStart}:I${dataRowEnd}`;
        const dependenciesRange = sheet.getRange(dependenciesRangeAddress);
        applyListDataValidation(
          dependenciesRange,
          `=${taskNamesRangeName}`, 
          'Please select a valid Task Name from the dropdown.',
          'Invalid Dependency',
          'Select a Task Name from the dropdown.',
          'Dependencies'
        );
        dependenciesRange.dataValidation.load(['rule', 'errorAlert', 'prompt']);
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
          border.color = '#000000'; // Black border
        });
        console.log('Borders applied to data range');
        sheet.getUsedRange().format.autofitColumns();
        sheet.getUsedRange().format.autofitRows();
        console.log('Autofit applied to columns and rows');
        sheet.freezePanes.freezeRows(1);
        console.log('Top row frozen');
        await context.sync();
        message.success('Project management template inserted successfully.');
      }); 
    } catch (error) {
      console.error('Error inserting template into Excel:', error);
      message.error('Failed to insert template into Excel.');
    }
  };

  const createGanttChart = async () => {
    try {
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const table = sheet.tables.getItemOrNullObject('GanttTable');
        table.load(['name', 'dataBodyRange', 'rows']);
        await context.sync();
        if (table.isNullObject) {
          message.warning('GanttTable not found on the active worksheet.');
          return;
        }
        const dataRange = table.getDataBodyRange();
        dataRange.load('values');
        await context.sync();
        const data: any[][] = dataRange.values;
        if (!data || data.length === 0) {
          message.warning('No Gantt data found in the GanttTable.');
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
            const completedSerial: number | '' = row[4];
            const progress: number = row[7];
            const dependenciesRaw: string = row[8];
            if (
              typeof startSerial !== 'number' ||
              typeof endSerial !== 'number' ||
              (completedSerial !== '' && typeof completedSerial !== 'number')
            ) {
              console.warn(`Invalid serial numbers for task: ${taskName}, row`);
              return null; // Skip invalid rows
            }
            const startDate: Date = excelSerialToDate(startSerial);
            const endDate: Date = excelSerialToDate(endSerial);
            const completedDate: Date | undefined =
              completedSerial !== '' ? excelSerialToDate(completedSerial) : undefined;
            if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
              console.warn(`Invalid start date for task: ${taskName}, startDate`);
              return null;
            }
            if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
              console.warn(`Invalid end date for task: ${taskName}, endDate`);
              return null;
            }
            if (completedSerial !== '' && (!completedDate || isNaN(completedDate.getTime()))) {
              console.warn(`Invalid completed date for task: ${taskName}, completedDate`);
              return null;
            }
            const dependencies: string = dependenciesRaw
              ? dependenciesRaw
                  .toString()
                  .split(',')
                  .map((dep: string) => `task-${dep.trim().replace(/\s+/g, '-')}`)
                  .join(',')
              : '';
            let color: string;
            if (progress > 75) {
              color = '#00FF00';
            } else if (progress > 50) {
              color = '#FFFF00';
            } else {
              color = '#FF0000';
            }
            return {
              id: `task-${taskName.replace(/\s+/g, '-')}`, 
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
        setWidgets((prevWidgets) => {
          const ganttWidgetExists = prevWidgets.some((widget) => widget.type === 'gantt');
          let updatedWidgets: Widget[];
          if (ganttWidgetExists) {
            updatedWidgets = prevWidgets.map((widget) => {
              if (widget.type === 'gantt') {
                return { ...widget, data: { ...widget.data, tasks } };
              } else {
                return widget;
              }
            });
          } else {
            const newGanttWidget: Widget = {
              id: `gantt-${uuidv4()}`,
              type: 'gantt',
              data: {
                tasks,
                title: 'Gantt Chart',
                titleAlignment: 'left',
              } as GanttWidgetData,
            };
            updatedWidgets = [...prevWidgets, newGanttWidget];
            updateLayoutsForNewWidgets(updatedWidgets);
          }
          if (currentDashboard) {
            const updatedDashboard = {
              ...currentDashboard,
              components: updatedWidgets,
            };
            setCurrentDashboard(updatedDashboard);
            editDashboard(updatedDashboard);
            const updatedDashboards = dashboards.map((d) =>
              d.id === currentDashboard.id ? updatedDashboard : d
            );
            setDashboards(updatedDashboards);
            localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
          }
  
          localStorage.setItem('widgets', JSON.stringify(updatedWidgets));
          return updatedWidgets;
        });
  
        message.success('Gantt chart data prepared successfully.');
      });
    } catch (error) {
      console.error('Error creating Gantt chart:', error);
      message.error('Failed to create Gantt chart.');
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
  }
};
  

  const MAX_VERSIONS = 5;
  
  const saveDashboardVersion = () => {
    if (!currentDashboardId) {
      message.error('No dashboard is currently active.');
      return;
    }
  
    setDashboards((prevDashboards) => {
      const dashboardIndex = prevDashboards.findIndex((d) => d.id === currentDashboardId);
      if (dashboardIndex === -1) {
        message.error('Dashboard not found.');
        return prevDashboards;
      }
      const currentDashboard = prevDashboards[dashboardIndex];
      const newVersion: DashboardVersion = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        title: dashboardTitle,
        components: widgets,
        layouts,
      };
      const updatedVersions = [newVersion];
      if (currentDashboard.versions && currentDashboard.versions.length > 0) {
        updatedVersions.push(...currentDashboard.versions);
      }
      const limitedVersions = updatedVersions.slice(0, MAX_VERSIONS);
      const updatedDashboard: DashboardItem = {
        ...currentDashboard,
        versions: limitedVersions,
      };
      const updatedDashboards = [...prevDashboards];
      updatedDashboards[dashboardIndex] = updatedDashboard;
      localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
      message.success('Dashboard version saved.');
      return updatedDashboards;
    });
  };

  const restoreDashboardVersion = (versionId: string) => {
    if (!currentDashboardId) {
      message.error('No dashboard is currently active.');
      return;
    }
    const dashboard = dashboards.find((d) => d.id === currentDashboardId);
    if (!dashboard || !dashboard.versions) {
      message.error('No versions available for this dashboard.');
      return;
    }
    const version = dashboard.versions.find((v) => v.id === versionId);
    if (!version) {
      message.error('Version not found.');
      return;
    }
    setWidgets(version.components);
    setLayouts(version.layouts);
    setDashboardTitle(version.title);
    message.success('Dashboard restored to selected version.');
  };

  const fixInvalidLayouts = (
    layouts: { [key: string]: GridLayoutItem[] },
    widgets: Widget[]
  ): { [key: string]: GridLayoutItem[] } => {
    const updatedLayouts: { [key: string]: GridLayoutItem[] } = {};
    for (const breakpoint in layouts) {
      const layoutItems = layouts[breakpoint];
      updatedLayouts[breakpoint] = layoutItems.map((item) => {
        if (item.w <= 0 || item.h <= 0) {
          const widget = widgets.find((w) => w.id === item.i);
          const size = WIDGET_SIZES[widget?.type || ''] || { w: 8, h: 4 };
          return { ...item, w: size.w, h: size.h };
        }
        return item;
      });
    }
    return updatedLayouts;
  };

  const updateLayoutsForNewWidgets = (newWidgets: Widget[]) => {
    setLayouts((prevLayouts) => {
      const updatedLayouts: { [key: string]: GridLayoutItem[] } = {...prevLayouts};
      const breakpointList: Breakpoint[] = ['lg', 'md', 'sm'];
      breakpointList.forEach((breakpoint) => {
        const breakpointCols = GRID_COLS[breakpoint];
        const existingItemIds = new Set(updatedLayouts[breakpoint]?.map((item) => item.i));
        const widgetsToAdd = newWidgets.filter((widget) => !existingItemIds.has(widget.id));
        let yOffset = 0;
          updatedLayouts[breakpoint]?.reduce((maxY, item) => Math.max(maxY, item.y + item.h), 0) || 0;
        const newLayoutItems = widgetsToAdd.map((widget) => {
          let size = WIDGET_SIZES[widget.type] || { w: 8, h: 4 };
          if (size.w > breakpointCols) {
            size.w = breakpointCols;
          }
          let x = 0;
          if (widget.type === 'title') {
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

  const addDashboard = async (dashboard: DashboardItem) => {
    let components = dashboard.components;
    if (!components.some((w) => w.type === 'title')) {
      components = [defaultTitleWidget, ...components];
    }
    const updatedDashboard = { ...dashboard, components };
    const updatedDashboards = [...dashboards, updatedDashboard];
    setDashboards(updatedDashboards);
    localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
    if (!currentWorkbookId) {
      const workbookId = await getWorkbookIdFromProperties();
      setCurrentWorkbookId(workbookId);
    }
    setCurrentDashboardId(updatedDashboard.id);
    message.success('Dashboard saved successfully!');
  };

  const generateLayoutsForWidgets = (widgets: Widget[]): { [key: string]: GridLayoutItem[] } => {
    const updatedLayouts: { [key: string]: GridLayoutItem[] } = {};
    const breakpointList: Breakpoint[] = ['lg', 'md', 'sm'];
    breakpointList.forEach((breakpoint) => {
      const breakpointCols = GRID_COLS[breakpoint];
      let yOffset = 0;
      updatedLayouts[breakpoint] = widgets.map((widget) => {
        let size = WIDGET_SIZES[widget.type] || { w: 8, h: 4 };
        if (size.w > breakpointCols) {
          size.w = breakpointCols;
        }
        let x = 0;
        if (widget.type === 'title') {
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
    });
    return updatedLayouts;
  };

  const editDashboard = (dashboard: DashboardItem) => {
    if (!dashboard.layouts || Object.keys(dashboard.layouts).length === 0) {
      dashboard.layouts = generateLayoutsForWidgets(dashboard.components);
    }
    setDashboards((prevDashboards) => {
      const dashboardIndex = prevDashboards.findIndex((d) => d.id === dashboard.id);
      if (dashboardIndex === -1) {
        return prevDashboards;
      }
      const updatedDashboards = [...prevDashboards];
      updatedDashboards[dashboardIndex] = dashboard;
      localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
      return updatedDashboards;
    });
  };

  const deleteDashboard = (id: string) => {
    const updatedDashboards = dashboards.filter((d) => d.id !== id);
    setDashboards(updatedDashboards);
    localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
  };

  const setWidgetsAndLayouts = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    updateLayoutsForNewWidgets(newWidgets);
  };
  
  const updateWidgetsWithHistory = (updateFn: (prevWidgets: Widget[]) => Widget[]) => {
    setWidgets((prevWidgets) => {
      const newWidgets = updateFn(prevWidgets);
      setPastStates((prevPastStates) => [
        ...prevPastStates,
        { widgets: prevWidgets, layouts },
      ]);
      setFutureStates([]);
      return newWidgets;
    });
  };

  const setLayoutsWithHistory: React.Dispatch<
    React.SetStateAction<{ [key: string]: GridLayoutItem[] }>
  > = (update) => {
    setLayouts((prevLayouts) => {
      const newLayouts =
        typeof update === 'function' ? update(prevLayouts) : update;

      if (!isUndoRedoRef.current) {
        setPastStates((prevPastStates) => [
          ...prevPastStates,
          { widgets, layouts: prevLayouts },
        ]);
        setFutureStates([]);
      }

      return newLayouts;
    });
  };

  const addWidgetFunc = useCallback(
    (
      type: 'text' | 'chart' | 'gantt' | 'image' | 'metric' | 'report' | 'line' | 'title' ,
      data?: TextData | ChartData | GanttWidgetData | ImageWidgetData | MetricData | ReportData | LineWidgetData | TitleWidgetData
    ) => {
      if (type === 'title' && widgets.some((w) => w.type === 'title')) {
        message.warning('A title widget already exists.');
        return;
      }
      const newKey = `${type}-${uuidv4()}`;
      let newWidget: Widget;
      if (data) {
        newWidget = {
          id: newKey,
          type,
          data,
        } as Widget;
      } else {
        switch (type) {
          case 'line':
            newWidget = {
              id: newKey,
              type: 'line',
              data: {
                color: '#000000',
                thickness: 2,
                style: 'solid',
                orientation: 'horizontal',
              } as LineWidgetData,
            };
            break;
          case 'metric':
            newWidget = {
              id: newKey,
              type: 'metric',
              data: {
                cellAddress: 'C3',
                worksheetName: 'Sheet1',
                targetValue: 0,
                comparison: 'greater',
                fontSize: 28,
                displayName: 'KPI',
                format: 'number',
                currentValue: 0,
                titleAlignment: 'left',
                backgroundColor: '#ffffff',
                textColor: '#000000',
              } as MetricData,
            };
            break;
          case 'text':
            newWidget = {
              id: newKey,
              type: 'text',
              data: {
                content: '',
                fontSize: 16,
                textColor: '#000000',
                backgroundColor: '#ffffff',
                titleAlignment: 'left',
              } as TextData,
            };
            break;
          case 'image':
            newWidget = {
              id: newKey,
              type: 'image',
              data: {
                src: '',
                associatedRange: '',
                worksheetName: '',
              } as ImageWidgetData,
            };
            break;
          case 'chart':
            newWidget = {
              id: newKey,
              type: 'chart',
              data: {
                type: 'bar',
                title: 'Sample Chart',
                labels: ['January', 'February', 'March'],
                datasets: [
                  {
                    label: 'Sample Data',
                    data: [10, 20, 30],
                    backgroundColor: '#4caf50',
                  },
                ],
                titleAlignment: 'left',
                associatedRange: '',
                worksheetName: '',
              } as ChartData,
            };
            break;
          case 'gantt':
            newWidget = {
              id: newKey,
              type: 'gantt',
              data: {
                tasks: [],
                title: 'Gantt Chart',
                titleAlignment: 'left',
              } as GanttWidgetData,
            };
            break;
          case 'report':
            newWidget = {
              id: newKey,
              type: 'report',
              name: 'New Report',
              data: {
                columns: [],
                data: [],
              } as ReportData,
            };
            break;
          default:
            throw new Error(`Unsupported widget type: ${type}`);
          }
        }
      let missingFields: string[] = [];
      if (type === 'metric') {
        if (!('worksheetName' in newWidget.data) || !('cellAddress' in newWidget.data)) {
          missingFields.push('worksheetName', 'cellAddress');
        }
      }
      if (missingFields.length > 0) {
        message.warning(`Please provide the following fields: ${missingFields.join(', ')}`);
        promptForWidgetDetails(newWidget, (updatedWidget: Widget) => {
          setWidgets((prevWidgets) => {
            const newWidgets = [...prevWidgets, updatedWidget];
            updateLayoutsForNewWidgets(newWidgets); 
            localStorage.setItem('widgets', JSON.stringify(newWidgets));
            return newWidgets;
          });
          message.success(`${type.charAt(0).toUpperCase() + type.slice(1)} widget added successfully!`);
        });
        return;
      }
      updateWidgetsWithHistory((prevWidgets) => {
        const newWidgets = [...prevWidgets, newWidget];
        updateLayoutsForNewWidgets([newWidget]);
        if (currentDashboard) {
          const updatedDashboard = {
            ...currentDashboard,
            components: newWidgets,
          };
          setCurrentDashboard(updatedDashboard);
          editDashboard(updatedDashboard);
          const updatedDashboards = dashboards.map((d) =>
            d.id === currentDashboard.id ? updatedDashboard : d
          );
          setDashboards(updatedDashboards);
          localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
        }
        return newWidgets;
      });
    },
    [currentDashboard, dashboards, editDashboard, setDashboards, setCurrentDashboard, widgets, promptForWidgetDetails]
  );

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
        if (currentDashboard) {
          const updatedDashboard = {
            ...currentDashboard,
            components: newWidgets,
          };
          setCurrentDashboard(updatedDashboard);
          editDashboard(updatedDashboard);
          const updatedDashboards = dashboards.map((d) =>
            d.id === currentDashboard.id ? updatedDashboard : d
          );
          setDashboards(updatedDashboards);
          localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
        }
        return newWidgets;
      });
    },
    [currentDashboard, dashboards, editDashboard, setDashboards, setCurrentDashboard]
  );
  

  const updateWidgetFunc = useCallback(
    (
      id: string,
      updatedData: Partial<TextData | ChartData | GanttWidgetData | ImageWidgetData | ReportData | MetricData | LineWidgetData | TitleWidgetData>
    ) => {
      updateWidgetsWithHistory((prevWidgets) => {
        const newWidgets = prevWidgets.map((widget) => {
          if (widget.id !== id) return widget;
        switch (widget.type) {
          case 'text':
            return {
              ...widget,
              data: {
                ...widget.data,
                ...updatedData,
                content: (updatedData as Partial<TextData>).content ?? widget.data.content,
                fontSize: (updatedData as Partial<TextData>).fontSize ?? widget.data.fontSize,
                textColor: (updatedData as Partial<TextData>).textColor ?? widget.data.textColor,
                backgroundColor: (updatedData as Partial<TextData>).backgroundColor ?? widget.data.backgroundColor,
                titleAlignment: (updatedData as Partial<TextData>).titleAlignment ?? widget.data.titleAlignment,
              } as TextData,
            };
          case 'title':
            return {
              ...widget,
              data: {
                ...widget.data,
                ...updatedData,
              } as TitleWidgetData,
            };
          case 'chart':
            return {
              ...widget,
              data: {
                ...widget.data,
                ...updatedData,
              } as ChartData,
            };
          case 'gantt':
            return {
              ...widget,
              data: {
                ...widget.data,
                ...updatedData,
              } as GanttWidgetData,
            };
          case 'line':
            return {
              ...widget,
              data: {
                ...widget.data,
                ...updatedData,
              } as LineWidgetData,
            };
          case 'metric':
            return {
              ...widget,
              data: {
                ...widget.data,
                ...updatedData,
              } as MetricData,
            };
          case 'image':
            return {
              ...widget,
              data: {
                ...widget.data,
                ...updatedData,
              } as ImageWidgetData,
            };
          case 'report':
            return {
              ...widget,
              data: {
                ...widget.data,
                ...updatedData,
              } as ReportData,
            };
          default:
            return widget;
          }
        });
        if (currentDashboard) {
          const updatedDashboard = {
            ...currentDashboard,
            components: newWidgets,
          };
          setCurrentDashboard(updatedDashboard);
          editDashboard(updatedDashboard);
          const updatedDashboards = dashboards.map((d) =>
            d.id === currentDashboard.id ? updatedDashboard : d
          );
          setDashboards(updatedDashboards);
          localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
        }
        localStorage.setItem('widgets', JSON.stringify(newWidgets));
        return newWidgets;
      });
      message.success('Widget updated successfully!');
    },
    [currentDashboard, dashboards, editDashboard, setDashboards, setCurrentDashboard]
  );

  useEffect(() => {
    const migrateWidgets = () => {
      const storedWidgets: Widget[] = JSON.parse(localStorage.getItem('widgets') || '[]');
      const migratedWidgets = storedWidgets
        .map((widget) => {
          switch (widget.type) {
            case 'image': {
              const imageData: ImageWidgetData = {
                src: widget.data.src || '',
              };
              return { ...widget, data: imageData };
            }
            case 'chart': {
              const chartData: ChartData = {
                type: widget.data.type || 'bar',
                title: widget.data.title || 'Sample Chart',
                labels: widget.data.labels || [],
                datasets: widget.data.datasets || [],
                titleAlignment: widget.data.titleAlignment || 'left',
                associatedRange: widget.data.associatedRange || '',
                worksheetName: widget.data.worksheetName || '',
              };
              return { ...widget, data: chartData };
            }
            case 'metric': {
              const metricData: MetricData = {
                cellAddress: widget.data.cellAddress || '',
                worksheetName: widget.data.worksheetName || '',
                targetValue: widget.data.targetValue ?? 0,
                comparison: widget.data.comparison || 'greater',
                fontSize: widget.data.fontSize ?? 28,
                displayName: widget.data.displayName || 'KPI',
                format: widget.data.format || 'number',
                currentValue: widget.data.currentValue ?? 0,
                titleAlignment: widget.data.titleAlignment || 'left',
                backgroundColor: widget.data.backgroundColor || '#ffffff',
                textColor: widget.data.textColor || '#000000',
              };
              return { ...widget, data: metricData };
            }
            case 'text': {
              const textData: TextData = {
                content: widget.data.content || 'Your Dashboard Title',
                fontSize: widget.data.fontSize ?? 24,
                textColor: widget.data.textColor || '#000000',
                backgroundColor: widget.data.backgroundColor || '#ffffff',
                titleAlignment: widget.data.titleAlignment || 'left',
              };
              return { ...widget, data: textData };
            }
            case 'gantt': {
              const ganttData: GanttWidgetData = {
                tasks: widget.data.tasks || [],
                title: widget.data.title || 'Gantt Chart',
                titleAlignment: widget.data.titleAlignment || 'left',
              };
              return { ...widget, data: ganttData };
            }
            case 'report': {
              const reportData: ReportData = {
                columns: widget.data.columns || [],
                data: widget.data.data || [],
              };
              return { ...widget, data: reportData };
            }
            default:
              return null;
          }
        })
        .filter((widget: Widget | null) => widget !== null) as Widget[];
      if (!migratedWidgets.some((w: Widget) => w.type === 'title')) {
        migratedWidgets.unshift(defaultTitleWidget);
        updateLayoutsForNewWidgets([defaultTitleWidget]);
      }
      setWidgets(migratedWidgets);
      updateLayoutsForNewWidgets(migratedWidgets);
    };
    migrateWidgets();
  }, []);

  const migrateChartIndexToAssociatedRange = async () => {
    try {
      await Excel.run(async (context) => {
        const worksheets = context.workbook.worksheets;
        worksheets.load('items');
        await context.sync();
        let globalChartIndex = 0;
        const chartMap: { [key: number]: { worksheetName: string; associatedRange: string } } = {};
        worksheets.items.forEach((sheet) => {
          const charts = sheet.charts;
          charts.load('items');
          charts.items.forEach((chart) => {
            const dataRange = chart.getDataBodyRange();
            dataRange.load('address');
            chartMap[globalChartIndex] = {
              worksheetName: sheet.name,
              associatedRange: '', 
            };
            globalChartIndex++;
          });
        });
        await context.sync();
        globalChartIndex = 0;
        worksheets.items.forEach((sheet) => {
          const charts = sheet.charts;
          charts.items.forEach((chart) => {
            const key = globalChartIndex;
            const dataRange = chart.getDataBodyRange();
            if (dataRange.address) {
              chartMap[key].associatedRange = dataRange.address.toLowerCase();
              console.log(`Mapped chartIndex ${key} to range "${chartMap[key].associatedRange}" on worksheet "${sheet.name}".`);
            } else {
              console.warn(`Chart "${chart.name}" on worksheet "${sheet.name}" has no associated data range.`);
            }
            globalChartIndex++;
          });
        });
        setWidgets((prevWidgets) => {
          const newWidgets = prevWidgets.map((widget) => {
            if (widget.type === 'image') {
              const imageData = widget.data as ImageWidgetData & { chartIndex?: number };
              if ('chartIndex' in imageData && imageData.chartIndex !== undefined) {
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
                  return widget;
                }
              }
            } else if (widget.type === 'chart') {
              const chartData = widget.data as ChartData & { chartIndex?: number };
              if ('chartIndex' in chartData && chartData.chartIndex !== undefined) {
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
                  return widget;
                }
              }
            }
            return widget;
          });
          const cleanedWidgets = newWidgets.map((widget) => {
            if (widget.type === 'image') {
              const { chartIndex, ...rest } = widget.data as ImageWidgetData & { chartIndex?: number };
              return {
                ...widget,
                data: rest,
              };
            } else if (widget.type === 'chart') {
              const { chartIndex, ...rest } = widget.data as ChartData & { chartIndex?: number };
              return {
                ...widget,
                data: rest,
              };
            }
            return widget;
          });
          localStorage.setItem('widgets', JSON.stringify(cleanedWidgets));
          return cleanedWidgets;
        });
        console.log('Migration from chartIndex to associatedRange completed.');
        message.success('Widgets migrated to use associatedRange successfully.');
      });
    } catch (error) {
      console.error('Error migrating widgets:', error);
      message.error('Failed to migrate widgets to use associatedRange.');
    }
  };

  const promptUserToSelectWorksheetAndRange = async (): Promise<{ worksheetName: string; associatedRange: string }> => {
    return {
      worksheetName: 'Sheet1',
      associatedRange: 'A1:B4',
    };
  };

  const importChartImageFromExcel = async () => {
    try {
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const charts = sheet.charts;
        charts.load('items');
        await context.sync();
        if (charts.items.length > 0) {
          const imagePromises = charts.items.map(async (chart) => {
            const imageResult = chart.getImage() as OfficeExtension.ClientResult<string>;
            await context.sync();
            return imageResult.value;
          });
          const imageResults = await Promise.all(imagePromises);
          setWidgets((prevWidgets) => {
            const nonImageWidgets = prevWidgets.filter(widget => widget.type !== 'image');
            let imageWidgets = prevWidgets.filter(widget => widget.type === 'image');
            imageResults.forEach((base64Image, index) => {
              if (imageWidgets[index]) {
                imageWidgets[index].data.src = `data:image/png;base64,${base64Image}`;
              } else {
                imageWidgets.push({
                  id: `image-${uuidv4()}`,
                  type: 'image',
                  data: {
                    src: `data:image/png;base64,${base64Image}`,
                  },
                });
              }
            });
            imageWidgets = imageWidgets.slice(0, imageResults.length);
            return [...nonImageWidgets, ...imageWidgets];
          });
          const updatedWidgets = [
            ...widgets.filter(w => w.type !== 'image'),
            ...imageResults.map(img => ({
              id: `image-${uuidv4()}`,
              type: 'image',
              data: { src: `data:image/png;base64,${img}` },
            })),
          ];
          localStorage.setItem('widgets', JSON.stringify(updatedWidgets));
          message.success('All chart images imported and updated successfully.');
        } else {
          message.warning('No charts found on the active worksheet.');
        }
      });
    } catch (error) {
      console.error('Error importing chart image from Excel:', error);
      message.error('Failed to import chart image from Excel.');
    }
  };

  const copyWidget = useCallback(
    (widget: Widget) => {
      const newWidget: Widget = {
        ...widget,
        id: `${widget.type}-${uuidv4()}`,
      };
      addWidgetFunc(widget.type, newWidget.data);
      message.success('Widget copied!');
    },
    [addWidgetFunc]
  );

  const isCellAddressInRange = async (
    context: Excel.RequestContext,
    sheet: Excel.Worksheet,
    cellAddress: string,
    rangeAddress: string
  ): Promise<boolean> => {
    try {
      const cellRange = sheet.getRange(cellAddress);
      const selectedRange = sheet.getRange(rangeAddress);
      cellRange.load(['rowIndex', 'columnIndex']);
      selectedRange.load(['rowIndex', 'columnIndex', 'rowCount', 'columnCount']);
      await context.sync();
      const cellRow = cellRange.rowIndex;
      const cellColumn = cellRange.columnIndex;
      const rangeStartRow = selectedRange.rowIndex;
      const rangeStartColumn = selectedRange.columnIndex;
      const rangeEndRow = rangeStartRow + selectedRange.rowCount - 1;
      const rangeEndColumn = rangeStartColumn + selectedRange.columnCount - 1;
      return (
        cellRow >= rangeStartRow &&
        cellRow <= rangeEndRow &&
        cellColumn >= rangeStartColumn &&
        cellColumn <= rangeEndColumn
      );
    } catch (error) {
      console.error('Error checking if cell is within range:', error);
      return false;
    }
  };

  const refreshAllCharts = useCallback(async () => {
    if (!currentDashboard || !currentDashboard.workbookId) {
      message.error('No dashboard or workbook ID found.');
      return;
    }
    try {
      const currentWorkbookId = await getWorkbookIdFromProperties();
      if (currentWorkbookId !== currentDashboard.workbookId) {
        message.warning('This dashboard is not associated with the currently open workbook.');
        return;
      }
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
                errorMessages.push(
                  `Chart widget "${widget.id}" is missing worksheetName or associatedRange.`
                );
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
                errorMessages.push(
                  `Metric widget "${widget.id}" is missing worksheetName or cellAddress.`
                );
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
              const key = `${chartData.worksheetName.toLowerCase()}!${chartData.associatedRange.toLowerCase()}`;
              const range = rangeMap[key];
              if (range) {
                const data = range.values as any[][];
                if (data.length < 2) {
                  console.warn(`Not enough data in range ${key} for widget ${widget.id}.`);
                  return widget;
                }
                const labels = data.slice(1).map((row) => row[0]);
                const datasetLabels = data[0].slice(1);
                const updatedDatasets = datasetLabels.map(
                  (label: string, colIndex: number) => ({
                    label,
                    data: data.slice(1).map((row) => Number(row[colIndex + 1])),
                    backgroundColor:
                      chartData.datasets[colIndex]?.backgroundColor || getRandomColor(),
                    borderColor:
                      chartData.datasets[colIndex]?.borderColor || "#000000",
                    borderWidth: chartData.datasets[colIndex]?.borderWidth || 1,
                  })
                );
                const updatedChartData = {
                  ...chartData,
                  labels: [...labels], // New labels array
                  datasets: updatedDatasets.map((dataset) => ({ ...dataset })), // New datasets array
                };
                return {
                  ...widget,
                  data: updatedChartData,
                };
              } else {
                console.warn(`Range ${key} not found for Chart Widget ${widget.id}.`);
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
                  console.warn(
                    `The value in ${metricData.worksheetName}!${metricData.cellAddress} is not a number.`
                  );
                }
              } else {
                console.warn(
                  `Range ${key} not found for Metric Widget ${widget.id}.`
                );
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
          setCurrentDashboard(updatedDashboard);
          editDashboard(updatedDashboard);
          const updatedDashboards = dashboards.map((d) =>
            d.id === currentDashboard.id ? updatedDashboard : d
          );
          setDashboards(updatedDashboards);
          localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
        }
        localStorage.setItem("widgets", JSON.stringify(updatedWidgets));
        message.success("Charts and metrics have been refreshed successfully.");
      });
      await importChartImageFromExcel();
    } catch (error) {
      if (error instanceof OfficeExtension.Error) {
        console.error(`Office.js Error: ${error.code} - ${error.message}`);
        message.error(`Office.js Error: ${error.code} - ${error.message}`);
      } else {
        console.error("Unexpected Error:", error);
        message.error(
          "An unexpected error occurred while refreshing charts."
        );
      }
    }
  }, [widgets, setWidgets, importChartImageFromExcel, updateWidgetFunc, addWidgetFunc, currentDashboard]);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const readDataFromExcel = async () => {
    if (!currentDashboard || !currentDashboard.workbookId) {
      message.error('No dashboard or workbook ID found.');
      return;
    }
    try {
      const currentWorkbookId = await getWorkbookIdFromProperties();
      if (currentWorkbookId !== currentDashboard.workbookId) {
        message.warning('This dashboard is not associated with the currently open workbook.');
        return;
      }
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const range = sheet.getUsedRange();
        range.load(['address', 'values']);
        await context.sync();
        const data: any[][] = range.values;
        if (data.length > 1) {
          const labels = data.slice(1).map((row: any[]) => row[0].toString());
          const values = data.slice(1).map((row: any[]) => Number(row[1]));
          const charts = sheet.charts;
          charts.load('items');
          await context.sync();
          if (charts.items.length === 0) {
            message.warning('No charts found to associate with the imported data.');
            return;
          }
          const chart = charts.items[0];
          const dataRange = chart.getDataBodyRange();
          dataRange.load('address');
          await context.sync();
          const associatedRange = dataRange.address.toLowerCase();
          const chartData: ChartData = {
            type: 'bar',
            title: 'Imported Data',
            labels,
            datasets: [
              {
                label: 'Data from Excel',
                data: values,
                backgroundColor: '#4caf50',
              },
            ],
            titleAlignment: 'left',
            associatedRange: associatedRange,
            worksheetName: sheet.name,
          };
          addWidgetFunc('chart', chartData);
          message.success('Data imported from Excel successfully.');
        } else {
          message.warning('No data found in the active worksheet.');
        }
      });
    } catch (error) {
      console.error('Error reading data from Excel:', error);
      message.error('Failed to read data from Excel.');
    }
  };

  const readGanttDataFromExcel = async () => {
    if (!currentDashboard || !currentDashboard.workbookId) {
      message.error('No dashboard or workbook ID found.');
      return;
    }
    try {
      const currentWorkbookId = await getWorkbookIdFromProperties();
      if (currentWorkbookId !== currentDashboard.workbookId) {
        message.warning('This dashboard is not associated with the currently open workbook.');
        return;
      }
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheet = context.workbook.worksheets.getItem('Gantt');
        sheet.load('name');
        await context.sync();
        if (sheet.name !== 'Gantt') {
          console.log('Not on Gantt sheet. Exiting readGanttDataFromExcel.');
          return;
        }
        const table = sheet.tables.getItemOrNullObject('GanttTable');
        table.load(['name', 'dataBodyRange']);
        await context.sync();
        if (table.isNullObject) {
          message.warning('GanttTable not found on the Gantt worksheet.');
          return;
        }
        const dataBodyRange = table.getDataBodyRange();
        dataBodyRange.load('values');
        await context.sync();
        const data: any[][] = dataBodyRange.values;
        if (!data || data.length === 0) {
          message.warning('No Gantt data found in the GanttTable.');
          return;
        }
        const tasks: Task[] = data
          .map((row: any[]) => {
            const taskName: string = row[0];
            const taskType: string = row[1];
            const startSerial: number = row[2];
            const endSerial: number = row[3];
            const completedSerial: number | '' = row[4];
            const progress: number = row[7];
            const dependenciesRaw: string = row[8];
            if (
              typeof startSerial !== 'number' ||
              typeof endSerial !== 'number' ||
              (completedSerial !== '' && typeof completedSerial !== 'number')
            ) {
              console.warn(`Invalid serial numbers for task: ${taskName}, row`);
              return null;
            }
            const startDate = excelSerialToDateString(startSerial);
            const endDate = excelSerialToDateString(endSerial);
            const completedDate =
              completedSerial !== '' ? excelSerialToDateString(completedSerial) : undefined;
            const dependencies: string = dependenciesRaw
              ? dependenciesRaw
                  .toString()
                  .split(',')
                  .map((dep: string) => `task-${dep.trim().replace(/\s+/g, '-')}`)
                  .join(',')
              : '';
            let color: string;
            if (progress > 75) {
              color = '#00FF00';
            } else if (progress > 50) {
              color = '#FFFF00';
            } else {
              color = '#FF0000';
            }
            return {
              id: `task-${taskName.replace(/\s+/g, '-')}`,
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
        setWidgets((prevWidgets) => {
          const ganttWidget = prevWidgets.find((widget) => widget.type === 'gantt');
          let updatedWidgets: Widget[];
          if (ganttWidget) {
            updatedWidgets = prevWidgets.map((widget) => {
              if (widget.id !== ganttWidget.id) return widget;
              if (widget.type === 'gantt') {
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
              type: 'gantt',
              data: {
                tasks,
                title: 'Gantt Chart',
                titleAlignment: 'left',
              } as GanttWidgetData,
            };
            updatedWidgets = [...prevWidgets, newGanttWidget];
            updateLayoutsForNewWidgets([newGanttWidget])
          }
          localStorage.setItem('widgets', JSON.stringify(updatedWidgets));
          return updatedWidgets;
        });
        message.success('Gantt chart data loaded from Excel.');
      });
    } catch (error) {
      console.error('Error reading Gantt data from Excel:', error);
      message.error('Failed to read Gantt data from Excel.');
    }
  };

  useEffect(() => {
    const registeredWidgets = new Set<string>();
    let eventResults: OfficeExtension.EventHandlerResult<Excel.WorksheetChangedEventArgs>[] = [];
    const setupMetricEventHandlers = async () => {
      if (!currentDashboard || !currentDashboard.workbookId) {
        return;
      }
      if (currentWorkbookId !== currentDashboard.workbookId) {
        console.warn('Current workbook does not match the dashboard workbook. Skipping event handler setup.');
        return;
      }
      await Excel.run(async (context) => {
        for (const widget of widgets) {
          if (widget.type === 'metric') {
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
            sheet.load('name');
            await context.sync();
            if (sheet.isNullObject) {
              console.warn(`Worksheet ${metricData.worksheetName} not found.`);
              continue;
            }
            const range = sheet.getRange(metricData.cellAddress);
            range.load('address');
            await context.sync();
            const eventResult = sheet.onChanged.add(async (event: Excel.WorksheetChangedEventArgs) => {
              if (event.address.toLowerCase() === range.address.toLowerCase()) {
                console.log(`Change detected in cell ${metricData.cellAddress} on sheet ${metricData.worksheetName}. Triggering update.`);
                await updateMetricValue(widget.id);
              }
            });
            eventResults.push(eventResult);
            console.log(`Event handler added for widget ${widget.id} on cell ${metricData.worksheetName}!${metricData.cellAddress}`);
            await updateMetricValue(widget.id);
          }
        }
      }).catch((error) => {
        console.error('Error setting up event handlers:', error);
      });
    };
    setupMetricEventHandlers();
    return () => {
      eventResults.forEach((eventResult) => {
        eventResult.remove();
        console.log('Event handler removed.');
      });
    };
  }, [widgets, currentDashboard?.id, currentDashboard?.workbookId]);
  
  useEffect(() => {
    const setupGanttEventHandlers = async () => {
      if (!currentDashboard || !currentDashboard.workbookId) {
        console.warn('No dashboard or workbook ID found. Skipping Gantt event handler setup.');
        return;
      }
      const currentWorkbookId = await getWorkbookIdFromProperties();
      if (currentWorkbookId !== currentDashboard.workbookId) {
        console.warn('Current workbook does not match the dashboard workbook. Skipping Gantt event handler setup.');
        return;
      }
      try {
        await Excel.run(async (context: Excel.RequestContext) => {
          const sheet = context.workbook.worksheets.getItemOrNullObject('Gantt');
          sheet.load('name');
          await context.sync();
          if (sheet.isNullObject) {
            console.warn('Gantt sheet does not exist.');
            return;
          }
          const eventHandler = async (_event: Excel.WorksheetChangedEventArgs) => {
            await readGanttDataFromExcel();
          };
          sheet.onChanged.add(eventHandler);
          ganttEventHandlersRef.current.push(eventHandler);
          await context.sync();
        });
      } catch (error) {
        console.error('Error setting up Gantt event handlers:', error);
      }
    };
  
    setupGanttEventHandlers();
    return () => {
      const removeGanttEventHandlers = async () => {
        try {
          await Excel.run(async (context: Excel.RequestContext) => {
            const sheet = context.workbook.worksheets.getItemOrNullObject('Gantt');
            sheet.load('name');
            await context.sync();
            if (sheet.isNullObject) {
              console.warn('Gantt sheet does not exist.');
              return;
            }
            ganttEventHandlersRef.current.forEach((handler: (event: Excel.WorksheetChangedEventArgs) => Promise<void>) => {
              sheet.onChanged.remove(handler);
            });
            ganttEventHandlersRef.current = [];
  
            await context.sync();
          });
        } catch (error) {
          console.error('Error removing Gantt event handlers:', error);
        }
      };
      removeGanttEventHandlers();
    };
  }, [currentDashboard?.id, currentDashboard?.workbookId]);

  const isValidCellAddress = (address: string) => {
    const cellAddressRegex = /^[A-Za-z]{1,3}[1-9][0-9]{0,6}$/;
    return cellAddressRegex.test(address);
  };

  const addTaskToGantt = async (newTask: Task) => {
    if (!newTask.name || !newTask.type || newTask.start === undefined || newTask.end === undefined) {
      message.error('Task is missing required fields.');
      return;
    }
    try {
      setWidgets((prevWidgets) => {
        const updatedWidgets = prevWidgets.map((widget) => {
          if (widget.type === 'gantt') {
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
        const ganttExists = updatedWidgets.some((w) => w.type === 'gantt');
        if (!ganttExists) {
          const newGanttWidget: Widget = {
            id: `gantt-${uuidv4()}`,
            type: 'gantt',
            data: {
              tasks: [newTask],
              title: 'Gantt Chart',
              titleAlignment: 'left',
            },
          };
          updatedWidgets.push(newGanttWidget);
        }
        updateLayoutsForNewWidgets(updatedWidgets);
        localStorage.setItem('widgets', JSON.stringify(updatedWidgets));
        return updatedWidgets;
      });
      await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getItem('Gantt');
        const table = sheet.tables.getItemOrNullObject('GanttTable');
        table.load(['name']);
        await context.sync();
        if (table.isNullObject) {
          message.error('GanttTable not found in the Gantt worksheet.');
          return;
        }
        const rowData: (string | number | boolean)[] = [
          newTask.name,
          capitalizeFirstLetter(newTask.type ?? ''),
          newTask.start,
          newTask.end,
          '',
          '',
          '',
          newTask.progress,
          newTask.dependencies ?? '',
        ];
        console.log('Row data to add:', rowData);
        table.rows.add(undefined, [rowData]);
        await context.sync();
      })
      message.success('Task added successfully and synced to Excel!');
    } catch (error) {
      console.error('Error adding task to Gantt widget and Excel:', error);
      if (error instanceof OfficeExtension.Error) {
        message.error(`Office.js Error: ${error.code} - ${error.message}`);
      } else {
        message.error('Failed to add task to Gantt widget and Excel.');
      }
    }
  };

  const updateMetricValue = async (widgetId: string) => {
    try {
      console.log(`Updating metric value for widget ID: ${widgetId}`);
      await Excel.run(async (context) => {
        const widgetIndex = widgets.findIndex((w) => w.id === widgetId);
        if (widgetIndex !== -1 && widgets[widgetIndex].type === 'metric') {
          const metricData = widgets[widgetIndex].data as MetricData;
          if (!isValidCellAddress(metricData.cellAddress)) {
            console.warn(`Invalid cell address for widget ${widgetId}: ${metricData.cellAddress}`);
            message.error('Invalid cell address specified for the metric widget.');
            return; 
          }
          console.log(`Fetching value from ${metricData.worksheetName}!${metricData.cellAddress}`);
          const sheet = context.workbook.worksheets.getItem(metricData.worksheetName);
          const range = sheet.getRange(metricData.cellAddress);
          range.load('values');
          await context.sync();
          const cellValue = range.values[0][0];
          console.log(`Retrieved cell value: ${cellValue}`); 
          const newValue = parseFloat(cellValue);
          console.log(`Parsed new value: ${newValue}`); 
          if (isNaN(newValue)) {
            console.warn(`The value in ${metricData.worksheetName}!${metricData.cellAddress} is not a number.`);
            message.warning(`The value in ${metricData.worksheetName}!${metricData.cellAddress} is not a valid number.`);
            return;
          }
          if (metricData.currentValue === newValue) {
            console.log('Metric value has not changed, skipping update.');
            return;
          }
          updateWidgetsWithHistory((prevWidgets) => {
            return prevWidgets.map((widget) => {
              if (widget.id === widgetId && widget.type === 'metric') {
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
      console.error('Error updating metric value:', error);
      message.error('Failed to update metric value. Please ensure the cell address is valid.');
    }
  };

  const setWorkbookIdInProperties = async (workbookId: string) => {
    if (isInDialog()) {
      console.log('Running in dialog; skipping setWorkbookIdInProperties.');
      return;
    }
    try {
      await Excel.run(async (context) => {
        const customProps = context.workbook.properties.custom;
        const existingProp = customProps.getItemOrNullObject("dashboardWorkbookId");
        await context.sync();
        if (!existingProp.isNullObject) {
          existingProp.delete();
          await context.sync();
        }
        customProps.add("dashboardWorkbookId", workbookId);
        await context.sync();
      });
    } catch (error) {
      console.error('Error setting workbook ID in custom properties:', error);
    }
  };

  const getWorkbookIdFromProperties = async (): Promise<string> => {
    if (isInDialog()) {
      console.log('Running in dialog; skipping getWorkbookIdFromProperties.');
      return '';
    }
    if (!(Office && Office.context && Office.context.host === Office.HostType.Excel)) {
      const workbookId = uuidv4();
      await setWorkbookIdInProperties(workbookId);
      return workbookId;
    }
    try {
      return await Excel.run(async (context) => {
        const customProps = context.workbook.properties.custom;
        const prop = customProps.getItemOrNullObject("dashboardWorkbookId");
        await context.sync();
        if (prop.isNullObject) {
          const workbookId = uuidv4();
          customProps.add("dashboardWorkbookId", workbookId);
          await context.sync();
          return workbookId;
        }
        prop.load("value");
        await context.sync();
        return prop.value;
      });
    } catch (error) {
      console.error('Error getting workbook ID from custom properties:', error);
      const workbookId = uuidv4();
      await setWorkbookIdInProperties(workbookId);
      return workbookId;
    }
  };
  
  const exportDashboardAsPDF = async (): Promise<void> => {
    const input = document.getElementById('dashboard-container');
    if (!input) {
      message.error('Dashboard container not found.');
      return;
    }
    try {
      const canvas = await html2canvas(input, { logging: true, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('dashboard.pdf');
      message.success('Dashboard exported as PDF successfully!');
    } catch (error) {
      console.error('Error exporting dashboard as PDF:', error);
      message.error('Failed to export dashboard as PDF.');
    }
  };
  const emailDashboard = () => {
    exportDashboardAsPDF()
      .then(() => {
        const mailtoLink = `mailto:?subject=Dashboard&body=Please find the attached dashboard.`;
        window.location.href = mailtoLink;
        message.info('Please attach the downloaded PDF to your email.');
      })
      .catch((error) => {
        console.error('Error exporting dashboard as PDF:', error);
        message.error('Failed to export dashboard as PDF.');
      });
  };
  const applyDataValidation = async () => {
    try {
      await Excel.run(async (context: Excel.RequestContext) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const taskTypeRange = sheet.getRange('B2:B100'); 
        const dependenciesRange = sheet.getRange('I2:I100'); 
        const taskTypeOptions = ['Task', 'Milestone', 'Project'];
        const taskTypeValues = taskTypeOptions.join(','); 
        applyListDataValidation(
          taskTypeRange,
          taskTypeValues,
          `Please select a valid Task Type: ${taskTypeOptions.join(', ')}`,
          'Invalid Task Type',
          'Select a Task Type from the dropdown.',
          'Task Type'
        );
        console.log('Data validation applied to Task Type column');
        applyListDataValidation(
          dependenciesRange,
          '=TaskNames',
          'Please select a valid Task Name from the dropdown.',
          'Invalid Dependency',
          'Select a Task Name from the dropdown.',
          'Dependencies'
        );
        console.log('Data validation applied to Dependencies column');
        await context.sync();
        message.success('Data validation applied successfully!');
      });
    } catch (error) {
      if (error instanceof OfficeExtension.Error) {
        console.error(`Office.js Error: ${error.code} - ${error.message}`);
      } else {
        console.error('Unexpected Error:', error);
      }
      message.error('Failed to apply data validation.');
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
        saveTemplate,
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
        addDashboard,
        saveDashboardVersion,
        restoreDashboardVersion,
        editDashboard,
        selectedRangeAddress,
        setSelectedRangeAddress,
        isFullscreenActive,
        setIsFullscreenActive,
        deleteDashboard,
        undo,
        redo,
        canUndo,
        canRedo,
        currentDashboard,
        setCurrentDashboard,
        currentTemplateId,
        setCurrentTemplateId,
        applyDataValidation,
        refreshAllCharts,
        reports,
        updateLayoutsForNewWidgets,
        addReport,
        setReports,
        editReport,
        addTaskToGantt,
        currentWorkbookId,
        deleteReport,
        setCurrentWorkbookId,
        writeMetricValue,
        promptForWidgetDetails: (widget: Widget, onComplete: (updatedWidget: Widget) => void ) => { setWidgetToPrompt({ widget, onComplete });},
      }}
    >
      {children}
      {widgetToPrompt && (
        <PromptWidgetDetailsModal
          widget={widgetToPrompt.widget}
          onComplete={handleWidgetDetailsComplete}
          onCancel={() => setWidgetToPrompt(null)}
        />
      )}
    </DashboardContext.Provider>
  );
};
