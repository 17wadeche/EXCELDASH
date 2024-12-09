// src/taskpane/components/widgets/MetricWidget.tsx

import React, { useEffect, useState, useContext } from 'react';
import { Card, Typography, Button, InputNumber, Tooltip, message } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  EditOutlined, 
  CheckOutlined, 
  CloseOutlined 
} from '@ant-design/icons';
import { DashboardContext } from '../../context/DashboardContext'; 
import { MetricData } from '../types';
import '../Dashboard.css'; // Ensure consistent styling

const { Title } = Typography;

interface MetricWidgetProps {
  id: string;
  data: MetricData;
}

const MetricWidget: React.FC<MetricWidgetProps> = ({ id, data }) => {
  const { writeMetricValue } = useContext(DashboardContext)!;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState<number>(data.currentValue || 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('MetricWidget data:', data);
    setInputValue(data.currentValue || 0);
  }, [data]);

  const currentValue = data.currentValue;

  const isMetricGood =
    data.comparison === 'greater'
      ? currentValue >= data.targetValue
      : currentValue <= data.targetValue;

  const arrowIcon = isMetricGood ? (
    <ArrowUpOutlined className="metric-arrow" />
  ) : (
    <ArrowDownOutlined className="metric-arrow" />
  );
  
  const color = isMetricGood ? '#3f8600' : '#cf1322';

  const formatValue = (value: number) => {
    switch (data.format) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  const formatTargetValue = (value: number) => {
    switch (data.format) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  const handleSave = async () => {
    if (inputValue === data.currentValue) {
      setIsEditing(false);
      return;
    }
    setIsLoading(true);
    try {
      await writeMetricValue(id, inputValue, data.worksheetName, data.cellAddress);
      console.log('Metric updated successfully.');
    } catch (error) {
      console.error('Error updating metric:', error);
      message.error('Failed to update metric.');
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setInputValue(data.currentValue || 0);
    setIsEditing(false);
  };

  return (
    <div
      className="metric-widget-container"
      style={{
        width: '100%',
        height: '100%',
        padding: '4px',
        overflow: 'hidden',
        border: '1px solid #ddd',
        backgroundColor: data.backgroundColor || '#fff',
        borderRadius: '8px',
        position: 'relative',
      }}
    >
      {/* Drag Handle */}
      <div
        className="drag-handle metric-header"
        style={{
          display: 'flex',
          justifyContent: data.titleAlignment === 'center' 
            ? 'center' 
            : data.titleAlignment === 'right' 
              ? 'flex-end' 
              : 'flex-start',
          padding: '4px',
          backgroundColor: '#f0f0f0',
          borderBottom: '1px solid #ddd',
          cursor: 'move',
          userSelect: 'none',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <Tooltip title="Drag Metric Widget" placement="top">
          <Title level={4} style={{ margin: 0, fontSize: '12px'  }}>
            {data.displayName && data.displayName.trim() !== '' ? data.displayName : 'Metric'}
          </Title>
        </Tooltip>
      </div>
      
      {/* Metric Value Section */}
      <div
        className="metric-value"
        style={{
          color,
          fontSize: data.fontSize || 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          margin: '8px 0',
        }}
      >
        {arrowIcon}
        {isEditing ? (
          <InputNumber
            min={0}
            value={inputValue}
            onChange={(value) => setInputValue(value || 0)}
            style={{ fontSize: data.fontSize || 24, width: '80px' }}
            aria-label="Metric Input"
          />
        ) : (
          <span className="metric-number">{formatValue(currentValue)}</span>
        )}
      </div>
      
      {/* Target Value Section */}
      <div
        className="metric-target-value"
        style={{
          fontSize: data.fontSize ? data.fontSize * 0.4 : 14,
          color: '#555',
          textAlign: 'center',
        }}
      >
        <span className="metric-target-label">Target: </span>
        <span className="metric-target-number" style={{ fontWeight: 'bold' }}>
          {formatTargetValue(data.targetValue)}
        </span>
      </div>
      
      {/* Edit Controls */}
      {isEditing && (
        <div style={{ marginTop: '8px', textAlign: 'center' }}>
          <Tooltip title="Save">
            <Button
              type="primary"
              shape="circle"
              icon={<CheckOutlined />}
              onClick={handleSave}
              loading={isLoading}
              style={{ marginRight: '4px' }}
              aria-label="Save Value"
            />
          </Tooltip>
          <Tooltip title="Cancel">
            <Button
              type="default"
              shape="circle"
              icon={<CloseOutlined />}
              onClick={handleCancel}
              style={{ marginLeft: '4px' }}
              aria-label="Cancel Edit"
            />
          </Tooltip>
        </div>
      )}
      {!isEditing && (
        <div className="metric-edit-button" style={{ position: 'absolute', bottom: '8px', right: '8px' }}>
          <Tooltip title="Edit Value">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => setIsEditing(true)}
              style={{ fontSize: '12px' }}
              aria-label="Edit Value"
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default MetricWidget;
