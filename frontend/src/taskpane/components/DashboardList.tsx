// src/taskpane/components/DashboardList.tsx

import React, { useContext, useState, useEffect } from 'react';
import { Layout, List, Button, Typography, Modal, message, Card, Tooltip, Row, Col, Input, Spin, Divider,Empty, Form } from 'antd';
import { DeleteOutlined, EyeOutlined, EditOutlined, PlusOutlined, SearchOutlined, FolderViewOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DashboardContext } from '../context/DashboardContext';
import { DashboardItem, User } from './types';
import { shareDashboard, searchUsers } from '../utils/api';

const { Content } = Layout;
const { Title } = Typography;
const { Search } = Input;

const DashboardList: React.FC = () => {
  const { dashboards, deleteDashboard, setCurrentDashboardId, updateDashboardTitle } = useContext(DashboardContext)!;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDashboards, setFilteredDashboards] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDashboardId, setEditDashboardId] = useState<string | null>(null);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [shareDashboardId, setShareDashboardId] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const filtered = dashboards.filter((dashboard) =>
        dashboard.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDashboards(filtered);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [dashboards, searchTerm]);
  const openShareModal = (dashboardId: string) => {
    setShareDashboardId(dashboardId);
    setIsShareModalVisible(true);
    setUserSearchTerm('');
    setSearchedUsers([]);
  };

  const closeShareModal = () => {
    setIsShareModalVisible(false);
    setShareDashboardId(null);
  };

  const fetchUsers = async (query: string) => {
    try {
      setSearchingUsers(true);
      const response = await searchUsers(query); 
      setSearchedUsers(response);
    } catch (error: any) {
      console.error('Error searching users:', error);
      message.error('Failed to search users.');
    } finally {
      setSearchingUsers(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchTerm.length > 1) {
        fetchUsers(userSearchTerm);
      } else {
        setSearchedUsers([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  const handleSelectUserToShare = async (email: string) => {
    if (!shareDashboardId) return;
    try {
      await shareDashboard(shareDashboardId, email);
      message.success(`Shared with ${email}`);
    } catch (error: any) {
      console.error('Error sharing dashboard:', error);
      message.error(error?.response?.data?.error || 'Failed to share dashboard.');
    }
  };

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
  const openEditModal = (dashboardId: string, currentTitle: string) => {
    setEditDashboardId(dashboardId);
    setEditTitle(currentTitle);
    setIsEditModalVisible(true);
  };
  const handleSaveTitle = () => {
    if (editDashboardId) {
      updateDashboardTitle(editDashboardId, editTitle);
      message.success('Title updated successfully!');
    }
    setIsEditModalVisible(false);
    setEditDashboardId(null);
    setEditTitle('');
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
                    <Tooltip title="Rename Dashboard" key="rename">
                      <Button
                        type="text"
                        icon={<FolderViewOutlined />}
                        onClick={() => openEditModal(dashboard.id, dashboard.title)}
                      />
                    </Tooltip>,
                    <Tooltip title="Share Dashboard" key="share">
                    <Button
                      type="text"
                      icon={<UserAddOutlined />}
                      onClick={() => openShareModal(dashboard.id)}
                    />
                  </Tooltip>,
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
      <Modal
        title="Edit Dashboard Title"
        open={isEditModalVisible}
        onOk={handleSaveTitle}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditTitle('');
          setEditDashboardId(null);
        }}
      >
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="New dashboard title"
        />
      </Modal>
      <Modal
      title="Share Dashboard"
      open={isShareModalVisible}
      footer={null}
      onCancel={closeShareModal}
    >
      <Input
        placeholder="Search for a user by name or email..."
        value={userSearchTerm}
        onChange={(e) => setUserSearchTerm(e.target.value)}
        allowClear
      />

      {searchingUsers ? (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Spin />
        </div>
      ) : (
        <List
          style={{ marginTop: 16 }}
          bordered
          dataSource={searchedUsers}
          locale={{ emptyText: 'No users found' }}
          renderItem={(user) => (
            <List.Item
              onClick={() => handleSelectUserToShare(user.userEmail)}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                title={user.userEmail}
                description={user.fullName || user.userEmail}
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
    </Layout>
  );
};

export default DashboardList;
