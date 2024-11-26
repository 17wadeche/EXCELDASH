// src/taskpane/components/CustomReport.tsx

import React, { useContext, useEffect, useState } from 'react';
import { Table, Button, Select, Input, Modal, Form, message } from 'antd';
import {
  ColumnType,
  TablePaginationConfig,
  SorterResult,
  FilterValue,
  TableCurrentDataSource,
} from 'antd/lib/table/interface';
import { ReloadOutlined } from '@ant-design/icons';
import { DashboardContext } from '../context/DashboardContext';
import { v4 as uuidv4 } from 'uuid';
import { Widget, ReportItem, ReportColumn } from './types'; // Adjust path as necessary
import { getWorkbookIdFromProperties } from '../utils/excelUtils'; // Adjust path as necessary

const { Option } = Select;

type TableDataItem = Record<string, any>;

const CustomReport: React.FC = () => {
  const [data, setData] = useState<TableDataItem[]>([]);
  const [originalData, setOriginalData] = useState<TableDataItem[]>([]);
  const [columns, setColumns] = useState<ReportColumn<TableDataItem>[]>([]);
  const [filterColumn, setFilterColumn] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const dashboardContext = useContext(DashboardContext);
  if (!dashboardContext) {
    throw new Error('DashboardContext must be used within a DashboardProvider');
  }
  const { addWidget, dashboards, editDashboard, addReport } = dashboardContext;

  const [isAddToDashboardModalVisible, setIsAddToDashboardModalVisible] = useState(false);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);
  const [isSaveReportModalVisible, setIsSaveReportModalVisible] = useState(false);
  const [reportName, setReportName] = useState('');

  const loadDataFromExcel = async () => {
    setLoading(true);
    try {
      await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const range = sheet.getUsedRange();
        range.load(['values', 'address']);
        await context.sync();

        const values = range.values;
        if (values.length === 0) {
          message.warning('No data found in the active worksheet.');
          setLoading(false);
          return;
        }

        const headers = values[0];
        const rows = values.slice(1);

        const tableColumns: ReportColumn<TableDataItem>[] = headers.map(
          (header: string, index: number) => ({
            title: header,
            dataIndex: `col${index}`,
            key: `col${index}`,
            sorter: (a: TableDataItem, b: TableDataItem) => {
              if (a[`col${index}`] < b[`col${index}`]) return -1;
              if (a[`col${index}`] > b[`col${index}`]) return 1;
              return 0;
            },
          })
        );

        const tableData: TableDataItem[] = rows.map((row: any[], rowIndex: number) => {
          const rowData: TableDataItem = { key: rowIndex };
          headers.forEach((_header: string, colIndex: number) => {
            rowData[`col${colIndex}`] = row[colIndex];
          });
          return rowData;
        });

        setColumns(tableColumns);
        setData(tableData);
        setOriginalData(tableData);
        setLoading(false);
      });
    } catch (error) {
      console.error('Error loading data from Excel:', error);
      message.error('Failed to load data from Excel.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataFromExcel();

    let eventResult: OfficeExtension.EventHandlerResult<Excel.WorksheetChangedEventArgs>;

    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();

      eventResult = sheet.onChanged.add(async () => {
        await loadDataFromExcel();
      });

      await context.sync();
    });

    return () => {
      if (eventResult) {
        eventResult.remove();
      }
    };
  }, []);

  const applyFilter = () => {
    if (!filterColumn) {
      message.warning('Please select a column to filter.');
      return;
    }
    const filteredData = originalData.filter((item) => {
      const cellValue = item[filterColumn];
      return cellValue
        .toString()
        .toLowerCase()
        .includes(filterValue.toLowerCase());
    });
    setData(filteredData);
  };

  const resetFilter = () => {
    setData(originalData);
    setFilterColumn(null);
    setFilterValue('');
  };

  const handleTableChange = (
    _pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<TableDataItem> | SorterResult<TableDataItem>[],
    _extra: TableCurrentDataSource<TableDataItem>
  ) => {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    if (activeSorter && activeSorter.order && activeSorter.field) {
      const { field, order } = activeSorter;
      const sortedData = [...data].sort((a, b) => {
        if (a[field as string] < b[field as string]) return order === 'ascend' ? -1 : 1;
        if (a[field as string] > b[field as string]) return order === 'ascend' ? 1 : -1;
        return 0;
      });
      setData(sortedData);
    } else {
      setData(originalData);
    }
  };

  const handleSaveReportCancel = () => {
    setIsSaveReportModalVisible(false);
    setReportName(''); // Reset the input
  };

  const handleSaveReportConfirm = async () => {
    if (reportName.trim()) {
      const currentWorkbookId = await getWorkbookIdFromProperties();

      if (!currentWorkbookId) {
        message.error('Failed to get the current workbook ID.');
        return;
      }

      const newReport: ReportItem = {
        id: uuidv4(),
        name: reportName.trim(),
        data: { columns, data },
        workbookId: currentWorkbookId,
      };
      addReport(newReport);
      message.success('Report saved successfully!');
      setIsSaveReportModalVisible(false);
      setReportName(''); // Reset the input
    } else {
      message.warning('Please enter a name for the report.');
    }
  };

  const handleSaveReport = () => {
    setIsSaveReportModalVisible(true);
  };

  const handleAddToDashboard = () => {
    setIsAddToDashboardModalVisible(true);
  };

  const handleAddToDashboardConfirm = () => {
    if (!selectedDashboardId) {
      message.warning('Please select a dashboard.');
      return;
    }
    const dashboard = dashboards.find((d) => d.id === selectedDashboardId);
    if (dashboard) {
      const reportData = { columns, data };
      const newWidget: Widget = {
        id: `report-${uuidv4()}`,
        type: 'report',
        name: reportName.trim(), // Ensure 'name' is included
        data: reportData,
      };
      dashboard.components.push(newWidget);
      editDashboard(dashboard);
      message.success('Report added to dashboard!');
      setIsAddToDashboardModalVisible(false);
    } else {
      message.error('Selected dashboard not found.');
    }
  };

  const handleAddToDashboardCancel = () => {
    setIsAddToDashboardModalVisible(false);
  };

  return (
    <div>
      <Form layout="inline" style={{ marginBottom: '16px' }}>
        <Form.Item label="Filter Column">
          <Select
            placeholder="Select column"
            style={{ width: 150 }}
            onChange={(value) => setFilterColumn(value)}
            value={filterColumn}
            allowClear
          >
            {columns.map((col) => (
              <Option key={col.dataIndex} value={col.dataIndex as string}>
                {col.title as string}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Filter Value">
          <Input
            placeholder="Enter filter value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            style={{ width: 150 }}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={applyFilter}>
            Apply Filter
          </Button>
        </Form.Item>
        <Form.Item>
          <Button onClick={resetFilter}>Reset Filter</Button>
        </Form.Item>
        <Form.Item>
          <Button type="default" onClick={handleSaveReport}>
            Save Report
          </Button>
        </Form.Item>
        <Form.Item>
          <Button type="default" onClick={handleAddToDashboard}>
            Add to Dashboard
          </Button>
        </Form.Item>
        <Form.Item>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadDataFromExcel}
            loading={loading}
          >
            Refresh Data
          </Button>
        </Form.Item>
      </Form>
      <Table<TableDataItem>
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 10 }}
        loading={loading}
        onChange={handleTableChange}
      />

      {/* Add to Dashboard Modal */}
      <Modal
        title="Select Dashboard"
        open={isAddToDashboardModalVisible}
        onOk={handleAddToDashboardConfirm}
        onCancel={handleAddToDashboardCancel}
        okText="Add"
        cancelText="Cancel"
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Select a dashboard"
          onChange={(value) => setSelectedDashboardId(value)}
          value={selectedDashboardId}
        >
          {dashboards.map((dashboard) => (
            <Option key={dashboard.id} value={dashboard.id}>
              {dashboard.title}
            </Option>
          ))}
        </Select>
      </Modal>

      {/* Save Report Modal */}
      <Modal
        title="Save Report"
        open={isSaveReportModalVisible}
        onOk={handleSaveReportConfirm}
        onCancel={handleSaveReportCancel}
        okText="Save"
        cancelText="Cancel"
      >
        <Form layout="vertical">
          <Form.Item label="Report Name" required>
            <Input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomReport;
