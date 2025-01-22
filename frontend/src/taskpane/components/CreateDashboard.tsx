// src/taskpane/components/CreateDashboard.tsx

import React, { useState, useContext, useEffect } from 'react';
import {
  Layout,
  Form,
  Input,
  Button,
  message,
  Modal,
  Tooltip,
  Row,
  Col,
  Card,
  List,
  Spin,
  Divider,
  Empty,
  Dropdown,
  Menu,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { DashboardContext } from '../context/DashboardContext';
import {
  DeleteOutlined,
  FolderAddOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { DashboardItem, NewDashboard, TemplateItem } from './types';
import {
  createCheckoutSession,
  checkSubscription,
  loginUser,
  registerUser,
  verifySubscription,
  checkRegistration,
  unsubscribeUser,
  createDashboard,
  getTemplates,
  deleteTemplateById,
  getDashboards,
} from './../utils/api';
import axios from 'axios';

const { Header, Content } = Layout;
const { Search } = Input;

const CreateDashboard: React.FC = () => {
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const {
    setDashboardTitle: setContextTitle,
    setWidgets,
    setCurrentTemplateId,
    setCurrentWorkbookId,
    setCurrentDashboardId,
    currentWorkbookId,
    setLayouts,
    setDashboards,
  } = useContext(DashboardContext)!;

  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Gear menu actions
  const handleLogout = () => {
    Modal.confirm({
      title: 'Are you sure you want to logout?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: () => {
        // Clear user data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isSubscribed');
        localStorage.removeItem('isRegistered');
        delete axios.defaults.headers.common['Authorization'];
        message.success('Logged out successfully!');
        navigate('/login');
      },
    });
  };

  const handleUnsubscribe = () => {
    Modal.confirm({
      title: 'Are you sure you want to unsubscribe?',
      content: 'This will cancel your subscription.',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          const email = localStorage.getItem('userEmail');
          if (!email) {
            message.error('User email not found.');
            return;
          }
          await unsubscribeUser(email);
          // Update subscription status in localStorage
          localStorage.setItem('isSubscribed', 'false');
          message.success('You have successfully unsubscribed.');
          navigate('/subscribe');
        } catch (error: any) {
          console.error('Error unsubscribing:', error);
          message.error('Failed to unsubscribe.');
        }
      },
    });
  };

  const menu = (
    <Menu>
      <Menu.Item key="unsubscribe" onClick={handleUnsubscribe}>
        Unsubscribe
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedTemplates, fetchedDashboards] = await Promise.all([
          getTemplates(),
          getDashboards(),
        ]);
        setTemplates(fetchedTemplates);
        setDashboards(fetchedDashboards);
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Failed to fetch templates/dashboards.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setDashboards]);

  const handleCreate = async () => {
    if (!dashboardTitle.trim()) {
      message.error('Dashboard title cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      let workbookId = currentWorkbookId;
      if (!workbookId) {
        message.info('Waiting for Workbook ID to be initialized...');
        return;
      }
      workbookId = workbookId.toLowerCase();
      setCurrentWorkbookId(workbookId);
      console.log('Front-End: Using Workbook ID to create dashboard:', workbookId);
      console.log('Front-End: Current Workbook ID from state:', currentWorkbookId);
      const newDashboard: NewDashboard = {
        title: dashboardTitle,
        components: [],
        layouts: {},
        workbookId: workbookId,
      };
      const createdDashboard: DashboardItem = await createDashboard(newDashboard);
      setWidgets(createdDashboard.components || []);
      setLayouts(createdDashboard.layouts || {});
      setDashboards((prev) => [...prev, createdDashboard]);
      setCurrentDashboardId(createdDashboard.id);
      message.success('Dashboard created successfully!');
      navigate(`/dashboard/${createdDashboard.id}`);
    } catch (error) {
      console.error(error);
      message.error('Failed to create dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createDashboardFromTemplate = async (template: any) => {
    if (!currentWorkbookId) {
      message.error('No workbook ID found. Cannot create dashboard from template.');
      return;
    }
    const dashboardToCreate: NewDashboard = {
      title: template.name || 'Untitled Dashboard',
      components: template.widgets || [],
      layouts: template.layouts || {},
      workbookId: currentWorkbookId,
    };
    try {
      const createdDashboard = await createDashboard(dashboardToCreate);
      setDashboards((prev) => [...prev, createdDashboard]);
      setCurrentDashboardId(createdDashboard.id);
      navigate(`/dashboard/${createdDashboard.id}`);
      message.success(`Dashboard "${createdDashboard.title}" created from template!`);
    } catch (error) {
      console.error('Error creating dashboard from template:', error);
      message.error('Failed to create dashboard from template.');
    }
  };

  const confirmDeleteTemplate = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this template?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => deleteTemplate(id),
      maskClosable: true,
    });
  };

  const deleteTemplate = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteTemplateById(id);
      const updatedTemplates = templates.filter((template) => template.id !== id);
      setTemplates(updatedTemplates);
      message.success('Template deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting template:', error);
      message.error('Failed to delete template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Create Dashboard</div>
        <Dropdown overlay={menu} placement="bottomRight">
          <SettingOutlined style={{ fontSize: '24px', cursor: 'pointer' }} />
        </Dropdown>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Row justify="center" gutter={[100, 24]}>
          <Col xs={24} sm={20} md={16} lg={12}>
            <Card
              bordered={false}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                background: '#fff',
              }}
            >
              <Form layout="vertical" onFinish={handleCreate}>
                <Form.Item
                  label="Dashboard Title"
                  name="dashboardTitle"
                  rules={[
                    {
                      required: true,
                      message: 'Please input the dashboard title!',
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter dashboard title"
                    value={dashboardTitle}
                    onChange={(e) => setDashboardTitle(e.target.value)}
                    prefix={<PlusOutlined />}
                    allowClear
                    size="large"
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    disabled={!dashboardTitle.trim()}
                    loading={isLoading}
                    size="large"
                    icon={<FolderAddOutlined />}
                    style={{
                      borderRadius: '8px',
                      height: '50px',
                      fontSize: '16px',
                      backgroundColor: '#1890ff',
                      borderColor: '#1890ff',
                      transition: 'background-color 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#40a9ff';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#1890ff';
                    }}
                  >
                    Create Dashboard
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>

        <Divider />

        <Row justify="center" gutter={[16, 24]}>
          <Col xs={24} sm={20} md={16} lg={12}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontWeight: '600', color: '#001529' }}>Choose a Template</h2>
              <p style={{ color: '#595959' }}>Select a template to quickly create a new dashboard.</p>
            </div>
            <Search
              placeholder="Search Templates"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              enterButton
              allowClear
              size="large"
              style={{ marginBottom: '20px' }}
            />
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Spin tip="Loading templates..." size="large" />
              </div>
            ) : filteredTemplates.length > 0 ? (
              <List
                grid={{
                  gutter: 16,
                  xs: 1,
                  sm: 2,
                  md: 3,
                  lg: 4,
                  xl: 4,
                  xxl: 6,
                }}
                dataSource={filteredTemplates}
                locale={{
                  emptyText: <Empty description="No Templates Found" />,
                }}
                renderItem={(template) => (
                  <List.Item>
                    <Card
                      hoverable
                      actions={[
                        <Tooltip title="Create Dashboard from Template" key="create">
                          <Button
                            type="primary"
                            shape="circle"
                            icon={<FolderAddOutlined />}
                            onClick={() => createDashboardFromTemplate(template)}
                          />
                        </Tooltip>,
                        <Tooltip title="Delete Template" key="delete">
                          <Button
                            type="default"
                            danger
                            shape="circle"
                            icon={<DeleteOutlined />}
                            onClick={() => confirmDeleteTemplate(template.id)}
                          />
                        </Tooltip>,
                      ]}
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          '0 8px 16px rgba(0, 0, 0, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <Card.Meta
                        title={<span style={{ fontSize: '18px', fontWeight: '500' }}>{template.name}</span>}
                      />
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No Templates Available" />
            )}
          </Col>
        </Row>

        {previewTemplate && (
          <Modal
            open={!!previewTemplate}
            title={`Preview: ${previewTemplate.name}`}
            footer={null}
            onCancel={() => setPreviewTemplate(null)}
            width={800}
            centered
            bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
            destroyOnClose
          >
            <p>Preview functionality has been removed.</p>
          </Modal>
        )}
      </Content>
    </Layout>
  );
};

export default CreateDashboard;
