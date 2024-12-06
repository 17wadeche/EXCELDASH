// src/taskpane/components/CreateDashboard.tsx

import React, { useState, useEffect, useContext } from 'react';
import { Layout, Form, Input, Button, message, Modal, Tooltip, Row, Col, Card, List, Avatar, Spin, Divider, Empty} from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardContext } from '../context/DashboardContext';
import { DeleteOutlined, FolderAddOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { setWorkbookIdInProperties } from '../utils/excelUtils';
import { DashboardItem } from './types';
const { Content } = Layout;
const { Search } = Input;
import { createCheckoutSession, checkSubscription, loginUser, registerUser, verifySubscription, checkRegistration, unsubscribeUser  } from './../utils/api';

interface Widget {
  id: string;
  title: string;
  content: string;
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
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [isSubscriptionModalVisible, setIsSubscriptionModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const location = useLocation();
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
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      checkSubscription(savedEmail)
        .then((result) => {
          setIsSubscribed(result.subscribed);
        })
        .catch((error) => console.error('Error checking subscription on mount:', error));
    }
  }, []);

  const handleEmailSubmit = async () => {
    if (!emailInput) {
      message.error('Please enter your email.');
      return;
    }
    setIsLoading(true);
    try {
      console.log('Starting subscription check for:', emailInput);
      const subscriptionResult = await checkSubscription(emailInput);
      console.log('Subscription result:', subscriptionResult);
      setIsSubscribed(subscriptionResult.subscribed);
  
      console.log('Starting registration check for:', emailInput);
      const registrationResult = await checkRegistration(emailInput);
      console.log('Registration result:', registrationResult);
      setIsRegistered(registrationResult.registered);
      
      setEmail(emailInput);
      localStorage.setItem('userEmail', emailInput);
      console.log('Email set to:', emailInput);
    } catch (error) {
      console.error('Error checking email:', error);
      message.error('Failed to check email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = () => {
    setIsSubscriptionModalVisible(true);
  };

  useEffect(() => {
    if (isSubscribed) {
      message.success('Subscription active!');
    }
  }, [isSubscribed]);

  const initiateCheckout = async (plan: 'monthly' | 'yearly') => {
    setIsLoading(true);
    try {
      const checkoutUrl = await createCheckoutSession(plan, email);
      console.log('Checkout URL:', checkoutUrl);
      Office.context.ui.displayDialogAsync(checkoutUrl, { height: 60, width: 40 }, (asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Failed) {
          console.error('Failed to open dialog:', asyncResult.error);
          message.error('Failed to initiate checkout.');
          return;
        }
  
        const dialog = asyncResult.value;
        dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
          console.log('Dialog closed, re-checking subscription...');
          checkSubscription(email).then(result => {
            setIsSubscribed(result.subscribed);
            if (result.subscribed) {
              message.success('Subscription active!');
            } else {
              message.error('Subscription not completed.');
            }
          }).catch(error => {
            console.error('Error re-checking subscription after dialog closed:', error);
            message.error('Failed to update subscription status.');
          });
        });
      });
    } catch (error: any) {
      console.error('Error initiating checkout:', error);
      message.error('Failed to initiate checkout.');
    } finally {
      setIsLoading(false);
      setIsSubscriptionModalVisible(false);
    }
  };

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data && event.data.action === 'subscriptionSuccess') {
        checkSubscription(email)
          .then(result => {
            setIsSubscribed(result.subscribed);
            if (result.subscribed) {
              message.success('Subscription successful!');
            } else {
              message.error('Subscription not completed.');
            }
          })
          .catch(error => {
            console.error('Error re-checking subscription:', error);
            message.error('Failed to update subscription status.');
          });
      }
    }
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [email]);

  const handleRegister = async () => {
    if (!email || !password) {
      message.error('Please enter your email and password.');
      return;
    }

    try {
      await registerUser(email, password);
      message.success('Registration successful. Please log in.');
      setIsRegistered(true);
    } catch (error) {
      console.error('Error during registration:', error);
      message.error('Failed to register.');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      message.error('Please enter your email and password.');
      return;
    }

    try {
      const token = await loginUser(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', email);
      setIsLoggedIn(true);
      message.success('Login successful.');
    } catch (error) {
      console.error('Error during login:', error);
      message.error('Failed to login.');
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isSubscribed');
    localStorage.removeItem('isRegistered');
    setIsLoggedIn(false);
    setIsSubscribed(false);
    setIsRegistered(false);
    setEmail('');
    message.success('Logged out successfully!');
    navigate('/'); // Redirect to the initial screen or another route
  };

  const handleUnsubscribe = async () => {
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (response.ok) {
        setIsSubscribed(false);
        message.success('Subscription canceled.');
      } else {
        message.error(`Failed to unsubscribe: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      message.error('Failed to unsubscribe.');
    }
  };

  if (!email) {
    return (
      <Layout style={{ padding: '24px', minHeight: '100vh' }}>
        <Content>
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h2>Enter your email</h2>
            <Form onFinish={handleEmailSubmit}>
              <Form.Item rules={[{ required: true, message: 'Please enter your email' }]}>
                <Input
                  placeholder="Enter your email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                Continue
              </Button>
            </Form>
          </div>
        </Content>
      </Layout>
    );
  }
  if (!isRegistered) {
    return (
      <Layout style={{ padding: '24px', minHeight: '100vh' }}>
        <Content>
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h2>Register</h2>
            <Form>
              <Form.Item>
                <Input
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Item>
              <Form.Item>
                <Input.Password
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Item>
              <Button type="primary" onClick={handleRegister}>
                Register
              </Button>
            </Form>
          </div>
        </Content>
      </Layout>
    );
  }
  
  if (!isSubscribed) {
    return (
      <Layout style={{ padding: '24px', minHeight: '100vh' }}>
        <Content>
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <Button type="primary" onClick={handleSubscribe}>
              Subscribe Now
            </Button>
            <Modal
              title="Choose a Subscription Plan"
              open={isSubscriptionModalVisible}
              onCancel={() => setIsSubscriptionModalVisible(false)}
              footer={null}
            >
              <Form layout="vertical">
                <Form.Item label="Email" required>
                  <Input
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Item>
                <Button
                  type="primary"
                  block
                  style={{ marginBottom: '10px' }}
                  onClick={() => initiateCheckout('monthly')}
                  disabled={isLoading || !email}
                >
                  Monthly - $10
                </Button>
                <Button
                  type="primary"
                  block
                  onClick={() => initiateCheckout('yearly')}
                  disabled={isLoading || !email}
                >
                  Yearly - $110
                </Button>
              </Form>
            </Modal>
          </div>
        </Content>
      </Layout>
    );
  }
  
  // If registered and subscribed but not logged in, show login
  if (!isLoggedIn) {
    return (
      <Layout style={{ padding: '24px', minHeight: '100vh' }}>
        <Content>
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h2>Login</h2>
            <Form>
              <Form.Item>
                <Input
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Item>
              <Form.Item>
                <Input.Password
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Item>
              <Button type="primary" onClick={handleLogin}>
                Login
              </Button>
            </Form>
          </div>
        </Content>
      </Layout>
    );
  }
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('isSubscribed', 'true');
  localStorage.setItem('isRegistered', 'true');

  return (
    <Layout style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Content>
        {/* Create Dashboard Form */}
        {isLoggedIn && isSubscribed && (
          <Row justify="end" style={{ marginBottom: '20px' }}>
            <Button style={{ marginRight: '10px' }} onClick={handleUnsubscribe} danger>
              Unsubscribe
            </Button>
            <Button onClick={handleLogout}>Logout</Button>
          </Row>
        )}
        
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
