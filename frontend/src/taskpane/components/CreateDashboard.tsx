// src/taskpane/components/CreateDashboard.tsx

import React, { useState, useContext, useEffect } from 'react';
import {Layout, Form, Input, Button, message, Modal, Tooltip, Row, Col, Card, List, Spin, Divider, Empty, Dropdown, Menu} from 'antd';
import { useNavigate } from 'react-router-dom';
import { DashboardContext } from '../context/DashboardContext';
import { DeleteOutlined, FolderAddOutlined, PlusOutlined, SettingOutlined} from '@ant-design/icons';
import { DashboardItem, NewDashboard, TemplateItem } from './types';
import { createCheckoutSession, checkSubscription, loginUser, registerUser, verifySubscription, checkRegistration,  unsubscribeUser, createDashboard, getTemplates, deleteTemplateById, getDashboards} from './../utils/api';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

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
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error('AuthContext must be used within an AuthProvider');
  }
  const { isLoggedIn, isVerified, setAuthState } = authContext;

  const handleLogout = () => {
    Modal.confirm({
      title: 'Are you sure you want to logout?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: () => {
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

  useEffect(() => {
    const initializeExcel = async () => {
      if (isLoggedIn && isVerified) {
        try {
          await Office.onReady();
          await Excel.run(async (context) => {
            const sheets = context.workbook.worksheets;
            let exampleSheet = sheets.getItemOrNullObject("Example Chart Data");
            exampleSheet.load("name");
            await context.sync();
            if (exampleSheet.isNullObject) {
              exampleSheet = sheets.add("Example Chart Data");
              const headers = [
                { range: "A1", text: "Bar Chart Data", bold: true, fontSize: 14 },
                { range: "A5", text: "Line Chart Data", bold: true, fontSize: 14 },
                { range: "A9", text: "Pie Chart Data", bold: true, fontSize: 14 },
                { range: "A13", text: "Doughnut Chart Data", bold: true, fontSize: 14 },
                { range: "A17", text: "Radar Chart Data", bold: true, fontSize: 14 },
                { range: "A22", text: "Polar Area Chart Data", bold: true, fontSize: 14 },
                { range: "A26", text: "Bubble Chart Data", bold: true, fontSize: 14 },
                { range: "A32", text: "Scatter Chart Data", bold: true, fontSize: 14 },
                { range: "A37", text: "Box Plot Data", bold: true, fontSize: 14 },
                { range: "A42", text: "Funnel Chart Data", bold: true, fontSize: 14 },
                { range: "A50", text: "Treemap Chart Data", bold: true, fontSize: 14 },
                { range: "A58", text: "Candlestick Chart Data", bold: true, fontSize: 14 },
              ];
              headers.forEach(header => {
                const headerRange = exampleSheet.getRange(header.range);
                headerRange.values = [[header.text]];
                if (header.bold) {
                  headerRange.format.font.bold = true;
                }
                if (header.fontSize) {
                  headerRange.format.font.size = header.fontSize;
                }
              });
              // ========== BAR CHART DATA ==========
              exampleSheet.getRange("A2:D2").values = [["", "Jan", "Feb", "Mar"]];
              exampleSheet.getRange("A3:D3").values = [["Sales", 10, 20, 30]];
              // ========== LINE CHART DATA ==========
              exampleSheet.getRange("A6:E6").values = [["", "Jan", "Feb", "Mar", "Apr"]];
              exampleSheet.getRange("A7:E7").values = [["Sales", 5000, 7000, 4000, 9000]];
              // ========== PIE CHART DATA ==========
              exampleSheet.getRange("A10:F10").values = [["", "Red", "Blue", "Green", "Yellow", "Purple"]];
              exampleSheet.getRange("A11:F11").values = [["Value", 30, 25, 20, 15, 10]];
              // ========== DOUGHNUT CHART DATA ==========
              exampleSheet.getRange("A14:F14").values = [["", "Group A", "Group B", "Group C", "Group D", "Group E"]];
              exampleSheet.getRange("A15:F15").values = [["Value", 45, 25, 15, 10, 5]];
              // ========== RADAR CHART DATA ==========
              exampleSheet.getRange("A18:F18").values = [
                ["", "Strength", "Speed", "Agility", "Intelligence", "Endurance"]
              ];
              exampleSheet.getRange("A19:F19").values = [["Series1", 10, 8, 6, 7, 9]];
              exampleSheet.getRange("A20:F20").values = [["Series2", 5, 6, 9, 7, 4]];
              // ========== POLAR AREA CHART DATA ==========
              exampleSheet.getRange("A23:F23").values = [
                ["", "North", "East", "South", "West", "Center"]
              ];
              exampleSheet.getRange("A24:F24").values = [["Value", 11, 16, 9, 14, 5]];
              // ========== BUBBLE CHART DATA ==========
              exampleSheet.getRange("A27:E27").values = [
                ["", "Point1", "Point2", "Point3", "Point4"]
              ];
              exampleSheet.getRange("A28:E28").values = [["X", 5, 10, 15, 20]];
              exampleSheet.getRange("A29:E29").values = [["Y", 10, 15, 5, 12]];
              exampleSheet.getRange("A30:E30").values = [["R", 10, 20, 15, 25]];
              // ========== SCATTER CHART DATA ==========
              exampleSheet.getRange("A33:E33").values = [
                ["", "Point1", "Point2", "Point3", "Point4"]
              ];
              exampleSheet.getRange("A34:E34").values = [["X", 1, 2, 3, 4]];
              exampleSheet.getRange("A35:E35").values = [["Y", 2, 5, 3, 7]];
              // ========== BOX PLOT DATA ==========
              exampleSheet.getRange("A38:F38").values = [["", "Q1", "Median", "Q3", "Min", "Max"]];
              exampleSheet.getRange("A39:F39").values = [["Sample1", 10, 20, 30, 5, 35]];
              exampleSheet.getRange("A40:F40").values = [["Sample2", 15, 25, 40, 10, 45]];
              // ========== FUNNEL CHART DATA ==========
              exampleSheet.getRange("A43:B43").values = [["Stage", "Value"]];
              exampleSheet.getRange("A44:B48").values = [
                ["Prospects", 200],
                ["Qualified", 100],
                ["Proposal", 60],
                ["Negotiation", 30],
                ["Closed", 15],
              ];
              // ========== TREEMAP CHART DATA ==========
              exampleSheet.getRange("A51:B51").values = [["Name", "Value"]];
              exampleSheet.getRange("A52:B56").values = [
                ["Category A", 10],
                ["Category B", 20],
                ["Category C", 15],
                ["Category D", 5],
                ["Category E", 25],
              ];
              // ========== FORCE-DIRECTED GRAPH DATA ==========
              // exampleSheet.getRange("A63").values = [["Force-Directed Graph Data"]];
              // exampleSheet.getRange("A64:C64").values = [["NodeId", "Group", "Value"]];
              // exampleSheet.getRange("A65:C68").values = [["A", "Group1", 12],["B", "Group1", 8],["C", "Group2", 15],["D", "Group2", 10]];
              // exampleSheet.getRange("E63").values = [["Edges"]];
              // exampleSheet.getRange("E64:H64").values = [["Source", "Target", "Value", "Label"]];
              // exampleSheet.getRange("E65:H68").values = [["A", "B", 1, "AB"],["B", "C", 1, "BC"],["C", "D", 1, "CD"],["A", "D", 2, "AD"]];
              // ========== CHOROPLETH CHART DATA ==========
              //exampleSheet.getRange("A70").values = [["Choropleth Chart Data"]];
              // exampleSheet.getRange("A71:B71").values = [["Region", "Value"]];
              //exampleSheet.getRange("A72:B75").values = [["US-CA", 25], ["US-TX", 15],["US-NY", 30],["US-FL", 10]];
              // ========== PARALLEL COORDINATES (PCP) DATA ==========
              // exampleSheet.getRange("A77").values = [["Parallel Coordinates Chart Data"]];
              // exampleSheet.getRange("A78:D78").values = [["Dim1", "Dim2", "Dim3", "Dim4"]];
              // exampleSheet.getRange("A79:D81").values = [[10, 30, 50, 20],[5, 40, 20, 10],[9, 25, 55, 22]];
              // ========== BAR WITH ERROR BARS DATA ==========
              // exampleSheet.getRange("A83").values = [["Bar with Error Bars Data"]];
              // exampleSheet.getRange("A84:D84").values = [["Label", "Value", "ErrorMinus", "ErrorPlus"]];
              // exampleSheet.getRange("A85:D87").values = [["A", 10, 2, 3], ["B", 15, 1, 2], ["C", 8, 1.5, 1.5]];
              // exampleSheet.getUsedRange().format.autofitColumns();
            }
            await context.sync();
            message.success('"Example Chart Data" sheet is ready.');
          });
        } catch (error) {
          console.error("Error creating Example Chart Data sheet:", error);
          message.error('Failed to initialize Excel sheet. Check console for details.');
        }
      }
    };
    initializeExcel();
  }, [isLoggedIn, isVerified]);
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#f0f2f5',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          boxShadow: 'none',
        }}
      >
        <Dropdown overlay={menu} placement="bottomRight">
          <Tooltip title="Settings">
            <SettingOutlined style={{ fontSize: '24px', cursor: 'pointer' }} />
          </Tooltip>
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
