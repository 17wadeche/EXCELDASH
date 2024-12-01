// src/taskpane/components/CreateDashboard.tsx

import React, { useState, useEffect, useContext } from 'react';
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
  Avatar,
  Spin,
  Divider,
  Empty,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { DashboardContext } from '../context/DashboardContext';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  FolderAddOutlined,
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { setWorkbookIdInProperties } from '../utils/excelUtils';
import { DashboardItem } from './types';
const { Content } = Layout;
const { Search } = Input;

interface Widget {
  id: string;
  title: string;
  content: string;
  // other properties
}

interface Template {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  thumbnailUrl?: string;
}

const CreateDashboard: React.FC = () => {
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const {
    setDashboardTitle: setContextTitle,
    setWidgets,
    setCurrentTemplateId,
    addDashboard,
    setCurrentWorkbookId,
    setCurrentDashboardId,
    currentWorkbookId,
    setLayouts,
  } = useContext(DashboardContext)!;

  useEffect(() => {
    setLoading(true);
    const storedTemplates = JSON.parse(
      localStorage.getItem('dashboardTemplates') || '[]'
    ) as Template[];
    setTimeout(() => {
      setTemplates(storedTemplates);
      setLoading(false);
    }, 500);
  }, []);

  const handleCreate = async () => {
    if (!dashboardTitle.trim()) {
      message.error('Dashboard title cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const workbookId = uuidv4(); // Generate a new workbookId
      await setWorkbookIdInProperties(workbookId);
      setCurrentWorkbookId(workbookId); // Update context

      const newDashboard = {
        id: uuidv4(),
        title: dashboardTitle,
        components: [], // Initialize with empty components
        layouts: {}, // Initialize layouts
        workbookId, // Assign the workbookId
      };

      addDashboard(newDashboard);
      message.success('Dashboard created successfully!');
      navigate(`/dashboard/${newDashboard.id}`);
    } catch (error) {
      console.error(error);
      message.error('Failed to create dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createDashboardFromTemplate = (template: any) => {
    if (!currentWorkbookId) {
      message.error('No workbook ID found. Cannot create dashboard from template.');
      return;
    }
  
    const newDashboard: DashboardItem = {
      id: uuidv4(),
      title: template.name || 'Untitled Dashboard',
      components: template.widgets || [],
      layouts: template.layouts || {},
      workbookId: currentWorkbookId, // TypeScript now knows this is a string
    };
  
    addDashboard(newDashboard); // Add to dashboards array
    setCurrentDashboardId(newDashboard.id); // Set current dashboard ID
    navigate(`/dashboard/${newDashboard.id}`); // Navigate to the dashboard page
    message.success(`Dashboard "${newDashboard.title}" created from template!`);
  };

  const editTemplate = (template: any) => {
    setContextTitle(template.name || 'Untitled Template');
    setWidgets(template.widgets || []);
    setCurrentTemplateId(template.id);
    navigate('/dashboard-editor');
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

  const deleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter((template) => template.id !== id);
    setTemplates(updatedTemplates);
    localStorage.setItem('dashboardTemplates', JSON.stringify(updatedTemplates));
    message.success('Template deleted successfully!');
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Content>
        {/* Create Dashboard Form */}
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
                    loading={loading}
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

        {/* Template Section */}
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

        {/* Preview Modal */}
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
