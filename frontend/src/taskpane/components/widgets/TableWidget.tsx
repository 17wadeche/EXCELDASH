import React, { useState, useEffect } from 'react';
import { Button, Table, Input } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { TableData } from '../types';

interface TableWidgetProps {
  id: string;
  name: string;
  data: TableData;
  onUpdateName?: (id: string, newName: string) => void;
}

const TableWidgetComponent: React.FC<TableWidgetProps> = ({
  id,
  name,
  data,
  onUpdateName,
}) => {
  const [title, setTitle] = useState(name);
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    setTitle(name);
  }, [name]);
  const handleBlur = () => {
    if (onUpdateName) {
      onUpdateName(id, title);
    }
    setIsEditing(false);
  };
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {isEditing ? (
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleBlur}
          onPressEnter={handleBlur}
        />
      ) : (
        <h3 style={{ cursor: 'pointer' }} onClick={() => setIsEditing(true)}>
          {title}
        </h3>
      )}
      <Table
        columns={data.columns as ColumnsType<any>}
        dataSource={data.data}
        pagination={false}
        rowKey={(record: any) => record.someUniqueId || JSON.stringify(record)}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default TableWidgetComponent;
