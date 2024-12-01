// src/taskpane/components/ReportView.tsx

import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardContext } from '../context/DashboardContext';
import { Table, message } from 'antd';

const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { reports } = useContext(DashboardContext)!;
  const [report, setReport] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const foundReport = reports.find((r) => r.id === id);
    if (foundReport) {
      setReport(foundReport);
    } else {
      message.error('Report not found.');
      navigate('/reports-list');
    }
  }, [id, reports, navigate]);

  if (!report) {
    return null;
  }

  return (
    <div style={{ padding: '24px' }}>
      <h2>{report.name}</h2>
      <Table dataSource={report.data.data} columns={report.data.columns} />
    </div>
  );
};

export default ReportView;
