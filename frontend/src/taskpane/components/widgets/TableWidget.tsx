// src/taskpane/components/widgets/TableWidget.tsx
import React from 'react';
import { Button, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { TableData } from '../types';

interface TableWidgetProps {
  id: string;
  name: string;
  data: TableData;
  onDelete: (id: string) => void;
}

// Renamed default export:
const TableWidgetComponent: React.FC<TableWidgetProps> = ({
  id,
  name,
  data,
  onDelete,
}) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <h3>{name}</h3>
      <Table
        columns={data.columns as ColumnsType<any>}
        dataSource={data.data}
        pagination={false}
        rowKey={(record: any) => record.someUniqueId || JSON.stringify(record)}
        style={{ width: '100%' }}
      />
      <Button danger onClick={() => onDelete(id)}>
        Remove Table
      </Button>
    </div>
  );
};

export default TableWidgetComponent;
