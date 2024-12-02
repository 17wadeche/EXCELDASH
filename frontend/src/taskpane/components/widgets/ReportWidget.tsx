// src/taskpane/components/widgets/ReportWidget.tsx

import React from 'react';
import { Table } from 'antd';
import { ReportData } from '../types';
import { MenuOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface ReportWidgetProps {
  id: string;
  name: string;
  data: ReportData;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ReportWidget: React.FC<ReportWidgetProps> = ({ id, name, data, onEdit, onDelete }) => {
  return (
    <div className="grid-item">
      {/* Drag Handle */}
      <div
        className="drag-handle"
        role="button"
        aria-label="Drag to reposition report"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            // Optional: Implement keyboard drag initiation if needed
          }
        }}
      >
        <MenuOutlined />
      </div>

      {/* Widget Actions (Edit, Delete) */}
      <div className="widget-actions">
        {onEdit && (
          <EditOutlined
            onClick={() => onEdit(id)}
            className="action-icon"
            aria-label={`Edit Report: ${name}`}
          />
        )}
        {onDelete && (
          <DeleteOutlined
            onClick={() => onDelete(id)}
            className="action-icon"
            aria-label={`Delete Report: ${name}`}
          />
        )}
      </div>

      {/* Report Table */}
      <div className="widget-card">
        <Table
          dataSource={data.data}
          columns={data.columns}
          pagination={{ pageSize: 5 }}
          rowKey={(record) => record.key || record.id}
          // Additional Table props as needed
        />
      </div>
    </div>
  );
};

export default ReportWidget;
