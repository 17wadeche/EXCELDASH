// src/taskpane/components/DashboardList.tsx

import React, { useContext, useState, useEffect } from 'react';
import { Layout, List, Button, Typography, Modal, message, Card, Tooltip, Row, Col, Input, Spin, Divider,Empty } from 'antd';
import { DeleteOutlined, EyeOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DashboardContext } from '../context/DashboardContext';
import { DashboardItem } from './types';

const { Content } = Layout;
const { Title } = Typography;
const { Search } = Input;

const DashboardList: React.FC = () => {
  const { dashboards, deleteDashboard, setCurrentDashboardId } = useContext(DashboardContext)!;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDashboards, setFilteredDashboards] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const filtered = dashboards.filter((dashboard) =>
        dashboard.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDashboards(filtered);
      setLoading(false);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timer);
  }, [dashboards, searchTerm]);

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this dashboard?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        deleteDashboard(id);
        message.success('Dashboard deleted successfully!');
      },
      maskClosable: true,
    });
  };

  const handleView = (id: string) => {
    setCurrentDashboardId(id);
    navigate(`/dashboard/${id}`);
  };

  const handleEdit = (id: string) => {
    setCurrentDashboardId(id);
    navigate(`/dashboard/${id}/edit`);
  };

  const handleCreateNew = () => {
    navigate('/create');
  };

  return (
    <Layout style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Content>
        {/* Header Section */}
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              My Dashboards
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
              Create New Dashboard
            </Button>
          </Col>
        </Row>

        {/* Search Bar */}
        <Row justify="center" style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={16} md={12} lg={8}>
            <Search
              placeholder="Search Dashboards"
              enterButton={<SearchOutlined />}
              allowClear
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
        </Row>

        <Divider />

        {/* Dashboard List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin tip="Loading Dashboards..." size="large" />
          </div>
        ) : filteredDashboards.length === 0 ? (
          <Empty description="No Dashboards Found" />
        ) : (
          <List
            grid={{
              gutter: 24,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 4,
              xxl: 6,
            }}
            dataSource={filteredDashboards}
            renderItem={(dashboard) => (
              <List.Item>
                <Card
                  hoverable
                  actions={[
                    <Tooltip title="Edit Dashboard" key="edit">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleView(dashboard.id)}
                      />
                    </Tooltip>,
                    <Tooltip title="Delete Dashboard" key="delete">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(dashboard.id)}
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
                        {dashboard.title || 'Untitled Dashboard'}
                      </span>
                    }
                    description={
                      <span style={{ color: '#595959' }}>
                        Components: {dashboard.components.length}
                      </span>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </Content>
    </Layout>
  );
};

export default DashboardList;
