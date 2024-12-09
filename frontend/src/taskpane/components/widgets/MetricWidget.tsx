import React, { useEffect, useState, useContext } from 'react';
import { Card, Typography, Button, InputNumber, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { DashboardContext } from '../../context/DashboardContext'; 
import { MetricData } from '../types';
import '../Dashboard.css'

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
      <Card
        className="metric-widget-card"
        style={{ 
          textAlign: 'center', 
          padding: '12px', 
          backgroundColor: data.backgroundColor || '#ffffff' 
        }}
        bordered={false}
      >
        {/* Title Section */}
        <div
          className="metric-header"
          style={{
            display: 'flex',
            justifyContent: data.titleAlignment === 'center' 
              ? 'center' 
              : data.titleAlignment === 'right' 
                ? 'flex-end' 
                : 'flex-start',
            padding: '0px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #ddd',
            marginBottom: '8px',
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {data.displayName && data.displayName.trim() !== '' ? data.displayName : 'Metric'}
          </Title>
        </div>
        
        {/* Metric Value Section */}
        <div
          className="metric-value"
          style={{
            color,
            fontSize: data.fontSize || 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          {arrowIcon}
          {isEditing ? (
            <InputNumber
              min={0}
              value={inputValue}
              onChange={(value) => setInputValue(value || 0)}
              style={{ fontSize: data.fontSize || 36 }}
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
            fontSize: data.fontSize ? data.fontSize * 0.5 : 18,
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
          <div style={{ marginTop: '8px' }}>
            <Tooltip title="Save">
              <Button
                type="primary"
                shape="circle"
                icon={<CheckOutlined />}
                onClick={handleSave}
                loading={isLoading}
                style={{ marginRight: '8px' }}
                aria-label="Save Value"
              />
            </Tooltip>
            <Tooltip title="Cancel">
              <Button
                type="default"
                shape="circle"
                icon={<CloseOutlined />}
                onClick={handleCancel}
                style={{ marginLeft: '8px' }}
                aria-label="Cancel Edit"
              />
            </Tooltip>
          </div>
        )}
      </Card>
      
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
