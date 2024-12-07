import React, { useEffect, useState, useContext } from 'react';
import { Card, Typography, Button, InputNumber, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { DashboardContext } from '../../context/DashboardContext'; 
import { MetricData } from '../types';
import Draggable from 'react-draggable';
import './MetricWidget.css';

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
    <div className="metric-widget-container" style={{ position: 'relative' }}>
      <Draggable handle=".drag-handle">
        <Card
          className="metric-widget-card"
          style={{
            textAlign: 'center',
            padding: '12px',
            backgroundColor: data.backgroundColor || '#ffffff',
          }}
          bordered={false}
        >
          {/* Title */}
          <div className="metric-header drag-handle" style={{ cursor: 'move' }}>
            <Title level={4} style={{ margin: 0 }}>
              {data.displayName?.trim() || 'Metric'}
            </Title>
          </div>

          {/* Metric Value Section */}
          <div className="metric-value" style={{ color }}>
            <span className="metric-arrow">{arrowIcon}</span>
            {isEditing ? (
              <InputNumber
                min={0}
                value={inputValue}
                onChange={(value) => setInputValue(value || 0)}
                style={{ fontSize: 24 }}
                aria-label="Metric Input"
              />
            ) : (
              <span>{formatValue(currentValue)}</span>
            )}
          </div>

          {/* Target Value Section */}
          <div className="metric-target-value">
            <span className="metric-target-label">Target: </span>
            <span className="metric-target-number">{formatTargetValue(data.targetValue)}</span>
          </div>
        </Card>
      </Draggable>
      {/* Edit Value Button */}
      {!isEditing && (
        <div className="metric-edit-button">
          <Tooltip title="Edit Value">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => setIsEditing(true)}
              style={{ fontSize: '16px' }}
              aria-label="Edit Value"
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default MetricWidget;
