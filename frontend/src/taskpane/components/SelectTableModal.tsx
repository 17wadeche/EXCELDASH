// src/taskpane/components/SelectTableModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Select, message } from 'antd';
import { DashboardContext } from '../context/DashboardContext';
import { useContext } from 'react';
import { Widget } from '../components/types';

const { Option } = Select;

interface SelectTableModalProps {
  visible: boolean;
  widget: Widget;
  onComplete: () => void;
  onCancel: () => void;
}

const SelectTableModal: React.FC<SelectTableModalProps> = ({ visible, widget, onComplete, onCancel }) => {
  const dashboardContext = useContext(DashboardContext);
  if (!dashboardContext) {
    throw new Error('DashboardContext must be used within a DashboardProvider');
  }

  const { getAvailableTables, updateWidget } = dashboardContext;

  const [tables, setTables] = useState<{ name: string; sheetName: string }[]>([]);
  const [selectedTable, setSelectedTable] = useState<{ name: string; sheetName: string } | null>(null);

  useEffect(() => {
    if (visible) {
      const fetchTables = async () => {
        const availableTables = await dashboardContext.getAvailableTables();
        if (availableTables.length === 0) {
          message.warning('No tables found in the Excel workbook.');
          onCancel();
        } else {
          setTables(availableTables.map(t => ({ name: t.name, sheetName: t.sheetName })));
        }
      };
      fetchTables();
    }
  }, [visible, dashboardContext, message, onCancel]);

  const handleOk = () => {
    if (selectedTable) {
      updateWidget(widget.id, {
        sheetName: selectedTable.sheetName,
        tableName: selectedTable.name,
      }).then(() => {
        onComplete();
        message.success('Table widget added successfully!');
      }).catch((error: any) => {
        console.error('Error updating widget:', error);
        message.error('Failed to add table widget.');
      });
    } else {
      message.warning('Please select a table.');
    }
  };

  return (
    <Modal
      title="Select a Table to Add"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Add Table"
    >
      <Select
        style={{ width: '100%' }}
        placeholder="Select an Excel table"
        onChange={(value) => {
          const table = tables.find(t => t.name === value);
          setSelectedTable(table || null);
        }}
      >
        {tables.map(table => (
          <Option key={table.name} value={table.name}>
            {table.name} (Sheet: {table.sheetName})
          </Option>
        ))}
      </Select>
    </Modal>
  );
};

export default SelectTableModal;
