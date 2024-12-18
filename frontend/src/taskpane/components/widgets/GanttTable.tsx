// src/taskpane/components/widgets/GanttTable.tsx

import React, { useState, useEffect } from 'react';
import { Table, Button } from 'antd';
import { Task } from '../types';
import ResizableTitle from './ResizableTable';

interface GanttTableProps {
  tasks: Task[];
}

const GanttTable: React.FC<GanttTableProps> = ({ tasks }) => {
  const [columns, setColumns] = useState<any[]>([]);

  useEffect(() => {
    const initialColumns = [
      {
        title: 'Progress',
        dataIndex: 'progress',
        key: 'progress',
        width: 100,
        render: (progress: number) => `${progress}%`,
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 120,
      },
      {
        title: 'Dependencies',
        dataIndex: 'dependencies',
        key: 'dependencies',
        width: 150,
        render: (deps: string[]) => deps.join(', '),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 150,
        render: () => (
          <span>
            <Button type="link">Edit</Button>
            <Button type="link">Delete</Button>
          </span>
        ),
      },
      // Add other desired columns with width
    ];

    setColumns(initialColumns);
  }, []);

  const handleResize =
    (index: number) =>
    (_e: React.SyntheticEvent<Element>, { size }: { size: { width: number; height: number } }) => {
      const nextColumns = [...columns];
      nextColumns[index] = {
        ...nextColumns[index],
        width: size.width,
      };
      setColumns(nextColumns);
    };

  const mergedColumns = columns.map((col, index) => ({
    ...col,
    onHeaderCell: (column: any) => ({
      width: column.width,
      onResize: handleResize(index),
    }),
  }));

  // Prepare data source without excluding any fields
  const dataSource = tasks.map(task => ({
    key: task.id,
    name: task.name,       // Retained in dataSource but not displayed
    start: task.start,     // Retained in dataSource but not displayed
    end: task.end,         // Retained in dataSource but not displayed
    progress: task.progress,
    type: task.type,
    dependencies: task.dependencies,
    // Include other fields as needed
  }));

  return (
    <Table
      components={{
        header: {
          cell: ResizableTitle,
        },
      }}
      bordered
      dataSource={dataSource}
      columns={mergedColumns}
      pagination={{ pageSize: 10 }}
    />
  );
};

export default GanttTable;
