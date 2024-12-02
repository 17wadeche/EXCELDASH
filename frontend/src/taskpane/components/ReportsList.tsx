// src/taskpane/components/ReportsList.tsx

import React, { useContext, useState, useEffect } from 'react';
import {
  Layout,
  Button,
  Typography,
  Modal,
  message,
  Spin,
  Divider,
  Empty,
  Row,
  Col,
  Input,
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DashboardContext } from '../context/DashboardContext';
import { ReportItem } from './types';
import ReportCard from './ReportCard';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
} from 'react-beautiful-dnd';

const { Content } = Layout;
const { Title } = Typography;
const { Search } = Input;

const ReportsList: React.FC = () => {
  const { reports, setReports, deleteReport } = useContext(DashboardContext)!;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReports, setFilteredReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const filterReports = () => {
      const filtered = reports.filter((report) =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReports(filtered);
    };

    filterReports();
  }, [reports, searchTerm]);

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this report?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        deleteReport(id);
        message.success('Report deleted successfully!');
      },
      maskClosable: true,
    });
  };

  const handleView = (id: string) => {
    navigate(`/report/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/report/${id}/edit`);
  };

  const handleCreateNew = () => {
    navigate('/create-report');
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedReports = Array.from(reports);
    const [removed] = reorderedReports.splice(result.source.index, 1);
    reorderedReports.splice(result.destination.index, 0, removed);

    setReports(reorderedReports);
  };

  return (
    <Layout style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Content>
        {/* Header Section */}
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              My Reports
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateNew}
              size="large"
              style={{ borderRadius: '8px', height: '50px' }}
            >
              Create New Report
            </Button>
          </Col>
        </Row>

        {/* Search Bar */}
        <Row justify="center" style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={16} md={12} lg={8}>
            <Search
              placeholder="Search Reports"
              enterButton={<SearchOutlined />}
              allowClear
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
        </Row>

        <Divider />

        {/* Reports List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin tip="Loading Reports..." size="large" />
          </div>
        ) : filteredReports.length === 0 ? (
          <Empty description="No Reports Found" />
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="reportsList" direction="vertical">
              {(provided: DroppableProvided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {filteredReports.map((report: ReportItem) => {
                    const reportIndex = reports.findIndex((r) => r.id === report.id);
                    return (
                      <Draggable key={report.id} draggableId={report.id} index={reportIndex}>
                        {(provided: DraggableProvided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              marginBottom: '16px',
                              ...provided.draggableProps.style,
                            }}
                          >
                            <ReportCard
                              report={report}
                              onView={handleView}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Content>
    </Layout>
  );
};

export default ReportsList;
