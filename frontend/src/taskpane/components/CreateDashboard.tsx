// src/taskpane/components/CreateDashboard.tsx

import React, { useState, useEffect, useContext } from 'react';
import { Layout, Form, Input, Button, message, Modal, Tooltip, Row, Col, Card, List, Avatar, Spin, Divider, Empty} from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardContext } from '../context/DashboardContext';
import { DeleteOutlined, FolderAddOutlined, PlusOutlined } from '@ant-design/icons';
import { DashboardItem, NewDashboard, TemplateItem } from './types';
const { Content } = Layout;
const { Search } = Input;
import { createCheckoutSession, checkSubscription, loginUser, registerUser, verifySubscription, checkRegistration, unsubscribeUser, createDashboard, getTemplates, deleteTemplateById, getDashboards } from './../utils/api';
import axios from 'axios';

interface Widget {
  id: string;
  title: string;
  content: string;
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
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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

  async function checkSubscriptionAndFetch(userEmail: string) {
    const result = await checkSubscription(userEmail);
    setIsSubscribed(result.subscribed);
    if (result.subscribed) {
      try {
        setLoading(true);
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
    }
  }

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const savedEmail = localStorage.getItem('userEmail');
    if (storedToken && savedEmail) {
      setIsLoggedIn(true);
      setEmail(savedEmail);
      checkRegistration(savedEmail)
        .then(res => setIsRegistered(res.registered))
        .catch(console.error);
      checkSubscriptionAndFetch(savedEmail).catch(console.error);
    }
  }, []);

  const handleEmailSubmit = async () => {
    if (!emailInput) {
      message.error('Please enter your email.');
      return;
    }
    setIsLoading(true);
    try {
      await checkSubscriptionAndFetch(emailInput);
      const registrationResult = await checkRegistration(emailInput);
      setIsRegistered(registrationResult.registered);
      setEmail(emailInput);
      localStorage.setItem('userEmail', emailInput);
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

  const initiateCheckout = async (plan: 'monthly' | 'yearly') => {
    setIsLoading(true);
    try {
      const checkoutUrl = await createCheckoutSession(plan, email);
      Office.context.ui.displayDialogAsync(checkoutUrl, { height: 60, width: 40 }, (asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Failed) {
          console.error('Failed to open dialog:', asyncResult.error);
          message.error('Failed to initiate checkout.');
          return;
        }
        const dialog = asyncResult.value;
        dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
          checkSubscriptionAndFetch(email).catch(console.error);
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
        checkSubscriptionAndFetch(email).catch(console.error);
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
      setIsLoading(true);
      await registerUser(email, password);
      message.success('Registration successful. Please log in.');
      setIsRegistered(true);
      localStorage.setItem('isRegistered', 'true');
    } catch (error) {
      console.error('Error during registration:', error);
      message.error('Failed to register.');
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = async () => {
    if (!email || !password) {
      message.error('Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      await loginUser(email, password);
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      message.success('Login successful.');
      await checkSubscriptionAndFetch(email);
    } catch (error) {
      console.error('Error during login:', error);
      message.error('Failed to login.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!dashboardTitle.trim()) {
      message.error('Dashboard title cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      let workbookId = currentWorkbookId;
      if (!workbookId) {
        message.info("Waiting for Workbook ID to be initialized...");
        return;
      }
      workbookId = workbookId.toLowerCase();
      setCurrentWorkbookId(workbookId);
      console.log("Front-End: Using Workbook ID to create dashboard:", workbookId);
      console.log("Front-End: Current Workbook ID from state:", currentWorkbookId);
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

  const editTemplate = (template: TemplateItem) => {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isSubscribed');
    localStorage.removeItem('isRegistered');
    delete axios.defaults.headers.common['Authorization'];
    setIsLoggedIn(false);
    setIsSubscribed(false);
    setIsRegistered(false);
    setEmail('');
    message.success('Logged out successfully!');
    navigate('/');
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribeUser(email);
      setIsSubscribed(false);
      message.success('Subscription canceled.');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      message.error('Failed to unsubscribe.');
    }
  };
  
  useEffect(() => {
    if (isLoggedIn) {
      // Wrap in Office.js Excel.run context
      Excel.run(async (context) => {
        const sheets = context.workbook.worksheets;

        // Check if "Example Chart Data" already exists
        let exampleSheet = sheets.getItemOrNullObject("Example Chart Data");
        exampleSheet.load("name");
        await context.sync();

        // If not found, add and populate
        if (exampleSheet.isNullObject) {
          exampleSheet = sheets.add("Example Chart Data");

          //
          // -- Bar Chart Data --
          //
          exampleSheet.getRange("A1").values = [["Bar Chart Data"]];
          exampleSheet.getRange("A2:B2").values = [["Category", "Value"]];
          exampleSheet.getRange("A3:B5").values = [
            ["Jan", 10],
            ["Feb", 20],
            ["Mar", 30],
          ];

          //
          // -- Line Chart Data --
          //
          exampleSheet.getRange("A7").values = [["Line Chart Data"]];
          exampleSheet.getRange("A8:B8").values = [["Month", "Sales"]];
          exampleSheet.getRange("A9:B12").values = [
            ["January", 5000],
            ["February", 7000],
            ["March", 4000],
            ["April", 9000],
          ];

          //
          // -- Pie Chart Data --
          //
          exampleSheet.getRange("D1").values = [["Pie Chart Data"]];
          exampleSheet.getRange("D2:E2").values = [["Category", "Value"]];
          exampleSheet.getRange("D3:E7").values = [
            ["Red", 30],
            ["Blue", 25],
            ["Green", 20],
            ["Yellow", 15],
            ["Purple", 10],
          ];

          //
          // -- Doughnut Chart Data (can be the same structure as Pie) --
          //
          exampleSheet.getRange("D9").values = [["Doughnut Chart Data"]];
          exampleSheet.getRange("D10:E10").values = [["Category", "Value"]];
          exampleSheet.getRange("D11:E15").values = [
            ["Group A", 45],
            ["Group B", 25],
            ["Group C", 15],
            ["Group D", 10],
            ["Group E", 5],
          ];

          //
          // -- Radar Chart Data --
          //
          exampleSheet.getRange("G1").values = [["Radar Chart Data"]];
          exampleSheet.getRange("G2:I2").values = [["Category", "Series1", "Series2"]];
          exampleSheet.getRange("G3:I7").values = [
            ["Strength", 10, 5],
            ["Speed", 8, 6],
            ["Agility", 6, 9],
            ["Intelligence", 7, 7],
            ["Endurance", 9, 4],
          ];

          //
          // -- Polar Area Chart Data --
          //
          exampleSheet.getRange("G9").values = [["Polar Area Chart Data"]];
          exampleSheet.getRange("G10:H10").values = [["Category", "Value"]];
          exampleSheet.getRange("G11:H15").values = [
            ["North", 11],
            ["East", 16],
            ["South", 9],
            ["West", 14],
            ["Center", 5],
          ];

          //
          // -- Bubble Chart Data (X, Y, Size) --
          //
          exampleSheet.getRange("J1").values = [["Bubble Chart Data"]];
          exampleSheet.getRange("J2:L2").values = [["X", "Y", "Size"]];
          exampleSheet.getRange("J3:L6").values = [
            [5, 10, 10],
            [10, 15, 20],
            [15, 5, 15],
            [20, 12, 25],
          ];

          //
          // -- Scatter Chart Data (X, Y) --
          //
          exampleSheet.getRange("J9").values = [["Scatter Chart Data"]];
          exampleSheet.getRange("J10:K10").values = [["X", "Y"]];
          exampleSheet.getRange("J11:K15").values = [
            [1, 2],
            [2, 5],
            [3, 3],
            [4, 7],
            [5, 6],
          ];

          // Autofit columns for clarity
          exampleSheet.getUsedRange().format.autofitColumns();
        }

        await context.sync();
      }).catch((error) => {
        console.error("Error creating Example Chart Data sheet:", error);
      });
    }
  }, [isLoggedIn]);

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
              <Button type="primary" htmlType="submit" loading={isLoading}>
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
              <Button type="primary" onClick={handleRegister} loading={isLoading}>
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
            <Button type="primary" onClick={handleSubscribe} loading={isLoading}>
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
              <Button type="primary" onClick={handleLogin} loading={isLoading}>
                Login
              </Button>
            </Form>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Content>
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