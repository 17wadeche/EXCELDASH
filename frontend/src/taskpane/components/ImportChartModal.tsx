// src/taskpane/components/ImportChartModal.tsx

import React, { useState, useEffect, useContext } from 'react';
import { Modal, Select, message } from 'antd';
import { DashboardContext } from '../context/DashboardContext';

const { Option } = Select;

interface ImportChartModalProps {
  visible: boolean;
  onCancel: () => void;
}

const ImportChartModal: React.FC<ImportChartModalProps> = ({ visible, onCancel }) => {
  const [availableCharts, setAvailableCharts] = useState<{ key: string; name: string }[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string>('');
  const { addWidget } = useContext(DashboardContext)!;

  useEffect(() => {
    if (visible) {
      fetchCharts();
    }
  }, [visible]);

  const fetchCharts = async () => {
    try {
      await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const charts = sheet.charts;
        charts.load('items');
        await context.sync();

        if (charts.items.length > 0) {
          const chartOptions = charts.items.map((chart) => ({
            key: chart.id,
            name: chart.name || chart.id,
          }));
          setAvailableCharts(chartOptions);
        } else {
          message.warning('No charts found on the active worksheet.');
          onCancel();
        }
      });
    } catch (error) {
      console.error('Error fetching charts from Excel:', error);
      message.error('Failed to fetch charts from Excel.');
      onCancel();
    }
  };

  const handleOk = async () => {
    if (!selectedChartId) {
      message.warning('Please select a chart.');
      return;
    }
    try {
      await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const chart = sheet.charts.getItem(selectedChartId);
        const image = chart.getImage();
        await context.sync();

        const base64Image = image.value;
        const imageSrc = `data:image/png;base64,${base64Image}`;

        const imageData = { src: imageSrc };
        addWidget('image', imageData);
        message.success('Chart image imported from Excel successfully.');
        onCancel();
      });
    } catch (error) {
      console.error('Error importing chart image from Excel:', error);
      message.error('Failed to import chart image from Excel.');
      onCancel();
    }
  };

  return (
    <Modal
      title="Select a Chart to Import"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
    >
      <Select
        style={{ width: '100%' }}
        placeholder="Select a chart"
        onChange={(value) => setSelectedChartId(value)}
      >
        {availableCharts.map((chart) => (
          <Option key={chart.key} value={chart.key}>
            {chart.name}
          </Option>
        ))}
      </Select>
    </Modal>
  );
};

export default ImportChartModal;
