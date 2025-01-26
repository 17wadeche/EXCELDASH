// src/taskpane/components/Dashboard.tsx

import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Modal, Card, Button, Tooltip, message } from 'antd';
import EditWidgetForm from './EditWidgetForm';
import MetricWidget from './widgets/MetricWidget';
import { BREAKPOINTS, GRID_COLS } from './layoutConstants';
import { isEqual } from 'lodash';
import LineSettingsModal from './LineSettingsModal';
import TitleWidgetComponent from './TitleWidget';
import { ReloadOutlined, CloseOutlined, EditOutlined, UndoOutlined, FundProjectionScreenOutlined, RedoOutlined, FullscreenExitOutlined, CopyOutlined, SaveOutlined, MenuOutlined } from '@ant-design/icons';
import './Dashboard.css';
import { DashboardContext } from '../context/DashboardContext';
import { Widget, ChartData, TextData, ImageWidgetData, TableData, GridLayoutItem, TableWidget, DashboardBorderSettings, LineWidgetData, TitleWidgetData, GanttWidgetData, MetricData, DashboardItem } from './types';
import TextWidget from './widgets/TextWidget';
import SalesChart from './widgets/SalesChart';
import GanttChartComponent from './widgets/GanttChart';
import ImageWidget from './widgets/ImageWidget';
import './themes.css';
import { v4 as uuidv4 } from 'uuid';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import TableWidgetComponent from './widgets/TableWidget';
import Draggable from 'react-draggable';
import { debounce } from 'lodash';
import LineWidget from './widgets/LineWidget';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PresentationDashboard from './PresentationDashboard';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ResponsiveGridLayout = WidthProvider(Responsive);
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

interface DashboardProps {
  isPresenterMode?: boolean;
  closePresenterMode?: () => void;
  onEditWidget?: (widget: Widget) => void;
  dashboardBorderSettings?: DashboardBorderSettings;
  isFullScreen?: boolean;
}

export const createPDF = async (): Promise<string | null> => {
  const container = document.getElementById('dashboard-container');
  if (!container) {
    message.error('Dashboard container not found.');
    return null;
  }
  try {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const containerWidth = container.scrollWidth + 5;
    const containerHeight = container.scrollHeight + 5;
    const canvas = await html2canvas(container, {
      useCORS: true,
      backgroundColor: '#FFF',
      width: containerWidth,
      height: containerHeight,
      scale: 2,
    });
    const imgData = canvas.toDataURL('image/png');
    const margin = 20;
    const canvasWidthPx = canvas.width;
    const canvasHeightPx = canvas.height;
    const pdf = new jsPDF('p', 'pt', [
      canvasWidthPx + margin * 2,
      canvasHeightPx + margin * 2,
    ]);
    pdf.addImage(imgData, 'PNG', margin, margin, canvasWidthPx, canvasHeightPx);
    const pdfDataUri = pdf.output('datauristring');
    message.success('Dashboard exported as PDF successfully!');
    return pdfDataUri;
  } catch (error) {
    console.error('Error exporting dashboard as PDF:', error);
    message.error('Failed to export dashboard as PDF.');
    return null;
  }
};

const Dashboard: React.FC<DashboardProps> = React.memo(({ isPresenterMode = false, closePresenterMode, isFullScreen }) => {
  const { widgets, addWidget, removeWidget, updateWidget, refreshAllCharts, layouts, setLayouts, setWidgets, setDashboardBorderSettings, updateLayoutsForNewWidgets, undo, dashboardBorderSettings, redo, canUndo, dashboardTitle, canRedo, currentDashboardId, currentDashboard, currentWorkbookId, availableWorksheets, setCurrentDashboard, setCurrentDashboardId, setDashboards, refreshTableWidgetData } = useContext(DashboardContext)!;
  const { id } = useParams<{ id: string }>();
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const isEditingEnabled = !isPresenterMode && !isFullscreenActive && !isFullScreen;
  const borderStyle: React.CSSProperties = useMemo(() => {
    return dashboardBorderSettings?.showBorder
      ? {
          border: `${dashboardBorderSettings.thickness}px ${dashboardBorderSettings.style} ${dashboardBorderSettings.color}`,
        }
      : {};
  }, [dashboardBorderSettings]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isLineSettingsModalVisible, setIsLineSettingsModalVisible] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const isUpdatingFromItem = useRef(false);
  const prevLayoutsRef = useRef<{ [key: string]: GridLayoutItem[] }>({});
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [fullScreenDialog, setFullScreenDialog] = useState<Office.Dialog | null>(null);
  const dashboardWidth = dashboardBorderSettings.width 
    ? Math.min(Math.max(dashboardBorderSettings.width, 300), 733)
    : 733;
  const wrapperStyle: React.CSSProperties = {
    width: `${dashboardWidth}px`,
    marginLeft: 0,
    marginRight: 'auto',
    backgroundColor: dashboardBorderSettings.backgroundColor || 'white',
    ...(dashboardBorderSettings.showBorder
      ? {
          border: `${dashboardBorderSettings.thickness}px ${dashboardBorderSettings.style} ${dashboardBorderSettings.color}`,
        }
      : {}),
  };

  const isOfficeInitialized =
    typeof Office !== 'undefined' &&
    Office.context &&
    Office.context.ui &&
    typeof Office.context.ui.displayDialogAsync === 'function';

  const [theme, setTheme] = useState('light-theme');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentWidget, setCurrentWidget] = useState<Widget | null>(null);

  const handleRefresh = useCallback(async () => {
    if (isPresenterMode) {
      return;
    }
    setIsRefreshing(true);
    await refreshAllCharts();
    setIsRefreshing(false);
  }, [isPresenterMode, refreshAllCharts]);

  useEffect(() => {
    if (isPresenterMode) return;
    if (!layouts) return;
    const layoutItemIds = new Set(
      Object.values(layouts)
        .flat()
        .map((item) => item.i)
    );
    const widgetsWithoutLayout = widgets.filter((widget) => !layoutItemIds.has(widget.id));
    if (widgetsWithoutLayout.length > 0) {
      console.log('Adding layouts for new widgets:', widgetsWithoutLayout.map((w) => w.id));
      updateLayoutsForNewWidgets(widgetsWithoutLayout);
    }
  }, [widgets, isPresenterMode, layouts, updateLayoutsForNewWidgets]);

  const handlePresentDashboard = async () => {
    try {
      const pdfDataUri = await createPDF();
      if (!pdfDataUri) {
        return;
      }
      const newWin = window.open('', '_blank');
      if (!newWin) {
        message.error('Failed to open new window (pop-up blocked?).');
        return;
      }
      newWin.document.write(`
        <html>
          <head><title>Dashboard PDF</title></head>
          <body style="margin:0;padding:0;overflow:hidden;">
            <iframe 
              width="100%" 
              height="100%" 
              style="border:none;" 
              src="${pdfDataUri}">
            </iframe>
          </body>
        </html>
      `);
      newWin.document.close();
      message.success('Opened Dashboard PDF in new tab via iframe!');
    } catch (error) {
      message.error('Failed to export the dashboard as PDF.');
      console.error(error);
    }
  };

  const handleExitPresentationMode = () => {
    setIsPresentationMode(false);
  };

  const handleDialogMessage = (args: Office.DialogParentMessageReceivedEventArgs) => {
    const messageFromChild = JSON.parse(args.message);
    if (isPresenterMode && messageFromChild.type === 'getDataFromRange') {
      fullScreenDialog?.messageChild(JSON.stringify({
        type: 'dataFromRangeError',
        widgetId: messageFromChild.widgetId,
        error: 'Data loading is disabled in full-screen mode.',
      }));
      return;
    }
    switch (messageFromChild.type) {
      case 'getDataFromRange': {
        const { widgetId, worksheetName, associatedRange } = messageFromChild;
        Excel.run(async (context) => {
          try {
            const sheet = context.workbook.worksheets.getItem(worksheetName);
            const range = sheet.getRange(associatedRange);
            range.load('values');
            await context.sync();
            const data = range.values;
            fullScreenDialog?.messageChild(JSON.stringify({
              type: 'dataFromRange',
              widgetId: widgetId,
              data: data,
            }));
          } catch (error: any) {
            console.error('Error getting data from range:', error);
            fullScreenDialog?.messageChild(JSON.stringify({
              type: 'dataFromRangeError',
              widgetId: widgetId,
              error: error.message || error.toString(),
            }));
          }
        });
        break;
      }
    }
  };

  useEffect(() => {
    if (fullScreenDialog && !isUpdatingFromItem.current) {
      const dashboardData = {
        components: widgets,
        layouts,
        id: currentDashboardId,
        title: dashboardTitle,
        borderSettings: dashboardBorderSettings,
      };
      fullScreenDialog.messageChild(
        JSON.stringify({
          type: 'updateDashboardData',
          dashboard: dashboardData,
          currentWorkbookId,
          availableWorksheets,
        })
      );
    }
  }, [widgets, layouts, dashboardBorderSettings, fullScreenDialog, currentDashboardId, dashboardTitle, currentWorkbookId, availableWorksheets]);
  useEffect(() => {
    if (id) {
      setCurrentDashboardId(id);
    }
  }, [id, setCurrentDashboardId]);
  useEffect(() => {
    if (
      currentDashboard &&
      currentDashboard.layouts &&
      Object.keys(currentDashboard.layouts).length > 0 &&
      !isEqual(currentDashboard.layouts, prevLayoutsRef.current)
    ) {
      setLayouts(currentDashboard.layouts);
      prevLayoutsRef.current = currentDashboard.layouts;
    }
  }, [currentDashboard, setLayouts]);

  const handleSave = useCallback(async () => {
    if (!currentDashboardId || !currentDashboard) return;
    setIsSaving(true);
    try {
      const updatedDashboard: DashboardItem = {
        ...currentDashboard,
        workbookId: currentWorkbookId,
        components: widgets,
        layouts: layouts,
        title: dashboardTitle,
        borderSettings: dashboardBorderSettings,
      };
      const res = await axios.put(`/api/dashboards/${currentDashboardId}`, updatedDashboard);
      const savedDashboard = res.data;
      setCurrentDashboard(savedDashboard);
      setDashboards((prev: DashboardItem[]) => {
        const idx = prev.findIndex((d: DashboardItem) => d.id === savedDashboard.id);
        if (idx === -1) {
          return [...prev, savedDashboard];
        } else {
          const newDashboards = [...prev];
          newDashboards[idx] = savedDashboard;
          return newDashboards;
        }
      });
      message.success('Dashboard saved successfully!');
    } catch (err) {
      console.error('Error saving dashboard:', err);
      message.error('Failed to save changes to server.');
    } finally {
      setIsSaving(false);
    }
  }, [currentDashboardId, currentDashboard, currentWorkbookId, widgets, layouts, dashboardTitle, dashboardBorderSettings, setCurrentDashboard, setDashboards ]);

  useEffect(() => {
    const saveDashboard = async () => {
      await handleSave(); 
    };
    const debounceTimer = setTimeout(() => {
      saveDashboard();
    }, 2000);
    return () => clearTimeout(debounceTimer);
  }, [widgets, layouts]);

  const handleLayoutChange = useCallback(
    (
      _currentLayout: GridLayoutItem[],
      allLayouts: { [key: string]: GridLayoutItem[] }
    ) => {
      const syncedLayouts = { ...layouts };
      BREAKPOINTS.forEach((bp) => {
        if (!allLayouts[bp]) {
          syncedLayouts[bp] = allLayouts.lg || allLayouts.md || [];
        } else {
          syncedLayouts[bp] = allLayouts[bp];
        }
      });
      setLayouts(syncedLayouts);
      if (!isEqual(allLayouts, prevLayoutsRef.current)) {
        prevLayoutsRef.current = allLayouts;
        console.log('Layouts updated locally (not saved).');
      }
    },
    [
      layouts,
      setLayouts,
    ]
  );
  const copyWidgetCallback = useCallback(
    (widget: Widget) => {
      const newWidget: Widget = {
        ...widget,
        id: `${widget.type}-${uuidv4()}`,
      };
      addWidget(widget.type, newWidget.data);
      message.success('Widget copied!');
    },
    [addWidget]
  );

  const handleRemoveWidget = useCallback(
    (id: string) => {
      const widgetToRemove = widgets.find((widget) => widget.id === id);
      if (widgetToRemove?.type === 'title') {
        message.warning('The title widget cannot be removed.');
        return;
      } else {
        removeWidget(id);
        message.info('Widget removed!');
      }
    },
    [widgets, removeWidget]
  );

  const handleEditWidget = useCallback((widget: Widget) => {
    setEditingWidget(widget);
    if (widget.type === 'line') {
      setIsLineSettingsModalVisible(true);
    } else {
      setCurrentWidget(widget);
      setIsModalVisible(true);
    }
  }, []);

  const handleLineSettingsSave = useCallback(
    (updatedData: LineWidgetData) => {
      if (editingWidget) {
        updateWidget(editingWidget.id, updatedData);
      }
      setIsLineSettingsModalVisible(false);
      setEditingWidget(null);
    },
    [editingWidget, updateWidget]
  );

  const handleLineSettingsCancel = useCallback(() => {
    setIsLineSettingsModalVisible(false);
    setEditingWidget(null);
  }, []);

  const handleModalCancel = useCallback(() => {
    setIsModalVisible(false);
    setCurrentWidget(null);
  }, []);

  const handleModalOk = useCallback(
    (updatedData: any) => {
      if (currentWidget) {
        updateWidget(currentWidget.id, updatedData);
      }
      setIsModalVisible(false);
      setCurrentWidget(null);
    },
    [currentWidget, updateWidget]
  );

  const openPresenterMode = useCallback(() => {
    if (isOfficeInitialized) {
      const url = window.location.origin + '/fullScreenDashboard.html';
      Office.context.ui.displayDialogAsync(
        url,
        { height: 99.5, width: 99.5, displayInIframe: true },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Failed) {
            message.error('Failed to open presenter mode.');
          } else {
            const dialog = result.value;
            setFullScreenDialog(dialog);
            dialog.addEventHandler(Office.EventType.DialogMessageReceived, (args: any) => {
              const data = JSON.parse(args.message);
              console.log('Received message from dialog:', data);
              if (data.type === 'fullscreenActive') {
                setIsFullscreenActive(data.active);
              } else if (data.type === 'requestState') {
                const dashboardData = {
                  components: widgets,
                  layouts,
                  id: currentDashboardId,
                  title: dashboardTitle,
                  borderSettings: dashboardBorderSettings,
                };
                dialog.messageChild(
                  JSON.stringify({
                    type: 'initialState',
                    dashboard: dashboardData,
                    currentWorkbookId,
                    availableWorksheets,
                  })
                );
              } else if (data.type === 'close') {
                dialog.close();
                setFullScreenDialog(null);
              } else if (data.type === 'updateDashboardData') {
                isUpdatingFromItem.current = true;
                setWidgets(data.dashboard.components);
                setLayouts(data.dashboard.layouts);
                setDashboardBorderSettings(data.dashboard.borderSettings);
                isUpdatingFromItem.current = false;
              } else if (data.type === 'getDataFromRange') {
                const { widgetId, worksheetName, associatedRange } = data;
                Excel.run(async (context) => {
                  try {
                    const sheet = context.workbook.worksheets.getItem(worksheetName);
                    const range = sheet.getRange(associatedRange);
                    range.load('values');
                    await context.sync();
                    const dataFromExcel = range.values;
                    dialog.messageChild(
                      JSON.stringify({
                        type: 'dataFromRange',
                        widgetId: widgetId,
                        data: dataFromExcel,
                      })
                    );
                  } catch (error: any) {
                    console.error('Error getting data from range:', error);
                    dialog.messageChild(
                      JSON.stringify({
                        type: 'dataFromRangeError',
                        widgetId: widgetId,
                        error: error.message || error.toString(),
                      })
                    );
                  }
                });
              }
            });
            const dashboardData = {
              components: widgets,
              layouts,
              id: currentDashboardId,
              title: dashboardTitle,
              borderSettings: dashboardBorderSettings,
            };
            dialog.messageChild(
              JSON.stringify({
                type: 'initialState',
                dashboard: dashboardData,
                currentWorkbookId,
                availableWorksheets,
              })
            );
          }
        }
      );
    } else {
      message.error('Presenter mode is not available outside of Office.');
    }
  }, [
    isOfficeInitialized,
    widgets,
    layouts,
    currentDashboardId,
    dashboardTitle,
    dashboardBorderSettings,
    currentWorkbookId,
    availableWorksheets,
    setFullScreenDialog,
    setWidgets,
    setLayouts,
    setDashboardBorderSettings,
    isUpdatingFromItem
  ]);

  const widgetElements = useMemo(() => {
    return widgets.map((widget) => {
      let content;
      if (widget.type === 'text') {
        content = <TextWidget data={widget.data as TextData} />;
      } else if (widget.type === 'chart') {
        const chartData = widget.data as ChartData;
        content = <SalesChart key={widget.id} data={chartData} type={chartData.type} />;
      } else if (widget.type === 'title') {
        content = <TitleWidgetComponent data={widget.data as TitleWidgetData} />;
      } else if (widget.type === 'image') {
        content = <ImageWidget data={widget.data as ImageWidgetData} />;
      } else if (widget.type === 'line') {
        content = <LineWidget data={widget.data as LineWidgetData} />;
      } else if (widget.type === 'gantt') {
        content = (
          <GanttChartComponent
            tasks={(widget.data as GanttWidgetData).tasks}
            title={(widget.data as GanttWidgetData).title}
            arrowColor={(widget.data as GanttWidgetData).arrowColor ?? '#7d7d7d'}
            defaultProgressColor={(widget.data as GanttWidgetData).defaultProgressColor ?? '#1890ff'}
          />
        );
      } else if (widget.type === 'metric') {
        content = <MetricWidget id={widget.id} data={widget.data as MetricData} />;
      } else if (widget.type === 'table') {
        const tableWidget = widget as TableWidget;
        content = (
          <TableWidgetComponent
            key={tableWidget.id}
            id={tableWidget.id}
            name={tableWidget.name}
            data={tableWidget.data as TableData}
            onRefresh={(id) => refreshTableWidgetData(id)}
          />
        );
      }

      return (
        <div
          key={widget.id}
          className="grid-item"
          style={{ padding: 0, margin: 0, position: 'relative' }}
        >
          {isEditingEnabled && (
            <div className="widget-actions">
              <EditOutlined
                onClick={() => handleEditWidget(widget)}
                className="action-icon"
                aria-label={`Edit ${widget.type} Widget`}
              />
              {widget.id !== 'dashboard-title' && (
                <>
                  <CloseOutlined
                    onClick={() => handleRemoveWidget(widget.id)}
                    className="action-icon"
                    aria-label={`Remove ${widget.type} Widget`}
                  />
                  <CopyOutlined
                    onClick={() => copyWidgetCallback(widget)}
                    className="action-icon"
                    aria-label={`Copy ${widget.type} Widget`}
                  />
                </>
              )}
            </div>
          )}
          {widget.type === 'line' ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                padding: 0,
                margin: 0,
                backgroundColor: 'white',
              }}
            >
              {content}
            </div>
          ) : (
            <Card
              className="widget-card"
              bordered={false}
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                margin: '0px',
                padding: '0px',
                boxShadow: 'none',
                backgroundColor: 'white',
              }}
            >
              {content}
            </Card>
          )}
        </div>
      );
    });
  }, [widgets, isEditingEnabled, handleRemoveWidget, handleEditWidget, copyWidgetCallback]);
  return (
    <div className="dashboard-wrapper" style={wrapperStyle}>
      <Draggable handle=".drag-handle">
        <div className={`fixed-vertical-toolbar ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="drag-handle">
            <Tooltip title="Drag Toolbar" placement="right">
              <MenuOutlined />
            </Tooltip>
          </div>
          {!isCollapsed && (
            <>
              <Tooltip title="Undo" placement="left">
                <Button
                  type="text"
                  icon={<UndoOutlined />}
                  onClick={undo}
                  disabled={!canUndo}
                  className="toolbar-button"
                  aria-label="Undo"
                />
              </Tooltip>
              <Tooltip title="Redo" placement="left">
                <Button
                  type="text"
                  icon={<RedoOutlined />}
                  onClick={redo}
                  disabled={!canRedo}
                  className="toolbar-button"
                  aria-label="Redo"
                />
              </Tooltip>
              <Tooltip title="Save" placement="left">
                <Button
                  type="text"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  className="toolbar-button"
                  aria-label="Save"
                  loading={isSaving}
                />
              </Tooltip>
              <Tooltip title="Refresh All Charts" placement="left">
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={isRefreshing}
                  disabled={isRefreshing}
                  className="toolbar-button"
                  aria-label="Refresh All Charts"
                />
              </Tooltip>
              <Tooltip title="Present Dashboard" placement="left">
                <Button
                  type="text"
                  icon={<FundProjectionScreenOutlined />}
                  onClick={handlePresentDashboard}
                  className="toolbar-button"
                  aria-label="Present Dashboard"
                />
              </Tooltip>
              {isPresentationMode && <PresentationDashboard />}
            </>
          )}
          <Tooltip title={isCollapsed ? 'Expand Toolbar' : 'Collapse Toolbar'} placement="left">
            <Button
              type="text"
              icon={isCollapsed ? <MenuOutlined /> : <CloseOutlined />}
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="toolbar-button toggle-button"
              aria-label={isCollapsed ? 'Expand Toolbar' : 'Collapse Toolbar'}
            />
          </Tooltip>
        </div>
      </Draggable>
      {isPresenterMode && (
        <div className="full-screen-exit-button">
          <Button type="primary" icon={<FullscreenExitOutlined />} onClick={closePresenterMode}>
            Exit Full Screen
          </Button>
        </div>
      )}
      <div
        id="dashboard-container"
        ref={dashboardRef}
        className="dashboard-container"
        style={{
          ...borderStyle,
          width: '100%',
          backgroundColor: dashboardBorderSettings.backgroundColor || 'white',
          marginLeft: 0,
          marginRight: 'auto',
          height: 'auto',
          overflow: 'auto',
          paddingBottom: '3px',
        }}
      >
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ xxl: 1920, xl: 1600, lg: 1200, md: 996, sm: 768 }}
          cols={GRID_COLS}
          rowHeight={2}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
          isResizable={isEditingEnabled}
          isDraggable={isEditingEnabled}
          compactType={null}
          preventCollision={false}
          allowOverlap={true}
          margin={[0, 0]}
          containerPadding={[0, 0]}
        >
          {widgetElements}
        </ResponsiveGridLayout>
        {isPresentationMode && (<PresentationDashboard /> )}
        <Modal title="Edit Widget" open={isModalVisible} onCancel={handleModalCancel} footer={null}>
          {currentWidget && (
            <EditWidgetForm
              widget={currentWidget}
              onSubmit={handleModalOk}
              onCancel={handleModalCancel}
              isPresenterMode={isPresenterMode}
            />
          )}
        </Modal>
        {isLineSettingsModalVisible && editingWidget && editingWidget.type === 'line' && (
          <LineSettingsModal
            visible={isLineSettingsModalVisible}
            data={editingWidget.data as LineWidgetData}
            onSave={handleLineSettingsSave}
            onCancel={handleLineSettingsCancel}
          />
        )}
      </div>
    </div>
  );
});
Dashboard.displayName = 'Dashboard';
export default Dashboard;
