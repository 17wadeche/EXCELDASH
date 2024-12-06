// src/taskpane/components/ReportCard.tsx

import React from 'react';
import { Card, Button, Tooltip } from 'antd';
import { DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { ReportItem } from './types'; // Adjust the path as needed

interface ReportCardProps {
  report: ReportItem;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = React.memo(({ report, onView, onDelete }) => {
  return (
    <Card
      hoverable
      actions={[
        <Tooltip title="View Report" key="view">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onView(report.id)}
            aria-label={`View Report: ${report.name}`}
          />
        </Tooltip>,
        <Tooltip title="Delete Report" key="delete">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(report.id)}
            aria-label={`Delete Report: ${report.name}`}
          />
        </Tooltip>,
      ]}
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 8px 24px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 4px 12px rgba(0, 0, 0, 0.1)';
      }}
    >
      <Card.Meta
        title={
          <span style={{ fontSize: '18px', fontWeight: '500', color: '#001529' }}>
            {report.name || 'Untitled Report'}
          </span>
        }
      />
    </Card>
  );
});

export default ReportCard;
