/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
// src/taskpane/components/CustomLayout.tsx

import React, { useContext, useState } from "react";
import { Layout, Menu, Button, Modal, Form, Input, message } from "antd";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  PlusOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  LineChartOutlined,
  DashboardOutlined,
  ScheduleOutlined,
  UploadOutlined,
  LineOutlined,
  TableOutlined,
  BorderOutlined,
  AppstoreOutlined,
  DownloadOutlined,
  MailOutlined,
  SaveOutlined,
  PictureOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { DashboardContext } from "../context/DashboardContext";
import ImportChartModal from "./ImportChartModal";
import VersionHistoryModal from "./VersionHistoryModal";
import DashboardSettingsModal from "./DashboardSettingsModal";
import "./CustomLayout.css";
const { Content, Sider } = Layout;
const { SubMenu } = Menu;

const CustomLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isImportChartModalVisible, setIsImportChartModalVisible] = useState(false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackForm] = Form.useForm();
  const [isVersionHistoryVisible, setIsVersionHistoryVisible] = useState(false);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const location = useLocation();
  const isFullScreen = location.pathname === "/full-screen";
  const dashboardContext = useContext(DashboardContext);
  if (!dashboardContext) {
    throw new Error("DashboardContext must be used within a DashboardProvider");
  }
  const {
    addWidget,
    generateProjectManagementTemplateAndGanttChart,
    exportDashboardAsPDF,
    emailDashboard,
    saveAsTemplate,
    saveDashboardVersion,
  } = dashboardContext;
  const isInDashboard = location.pathname.startsWith("/dashboard");
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const showImportChartModal = () => {
    setIsImportChartModalVisible(true);
  };
  const handleImportChartModalCancel = () => {
    setIsImportChartModalVisible(false);
  };
  const showFeedbackModal = () => {
    setIsFeedbackModalVisible(true);
  };
  const handleFeedbackCancel = () => {
    setIsFeedbackModalVisible(false);
  };
  const handleFeedbackSubmit = (values: any) => {
    const feedbackEmail = "excel.dashbooard.help@gmail.com";
    const subject = encodeURIComponent(values.subject);
    const body = encodeURIComponent(
      `Name: ${values.name || "N/A"}\nEmail: ${values.email || "N/A"}\n\n${values.message}`
    );
    const mailtoLink = `mailto:${feedbackEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
    message.success("Your email client has been opened to send feedback.");
    setIsFeedbackModalVisible(false);
    feedbackForm.resetFields();
  };
  const onCollapse = (collapsed: boolean) => {
    setCollapsed(collapsed);
  };
  return (
    <Layout className="custom-layout light-theme" style={{ minHeight: "100vh", width: "100%", height: "100%" }}>
      <Sider
        collapsible
        width={250}
        collapsedWidth={80}
        className="fixed-sider"
        collapsed={collapsed}
        onCollapse={onCollapse}
      >
        {!collapsed && <div className="logo">Dashboard</div>}
        <Menu mode="inline" selectedKeys={[location.pathname]}>
          <Menu.Item key="/create" icon={<PlusOutlined />}>
            <Link to="/create">Create Dashboard</Link>
          </Menu.Item>
          <Menu.Item key="/dashboard-list" icon={<UnorderedListOutlined />}>
            <Link to="/dashboard-list">Dashboard List</Link>
          </Menu.Item>
          {isInDashboard && (
            <SubMenu key="add-visuals" icon={<PictureOutlined />} title="Add Visuals">
              <Menu.Item
                key="dashboard-settings"
                icon={<BorderOutlined />}
                onClick={() => setIsSettingsModalVisible(true)}
              >
                Dashboard Settings
              </Menu.Item>
              <Menu.Item key="add-line" icon={<LineOutlined />} onClick={() => addWidget("line")}>
                Line
              </Menu.Item>
              <Menu.Item key="add-text" icon={<FileTextOutlined />} onClick={() => addWidget("text")}>
                Text
              </Menu.Item>
              <Menu.Item key="add-sales-chart" icon={<LineChartOutlined />} onClick={() => addWidget("chart")}>
                Chart
              </Menu.Item>
              <Menu.Item key="import-charts" icon={<UploadOutlined />} onClick={showImportChartModal}>
                Import Charts from Excel
              </Menu.Item>
              <Menu.Item
                key="test"
                icon={<ScheduleOutlined />}
                onClick={generateProjectManagementTemplateAndGanttChart}
              >
                Add Gantt Template
              </Menu.Item>
              <Menu.Item key="add-metric" icon={<DashboardOutlined />} onClick={() => addWidget("metric")}>
                Metric
              </Menu.Item>
              <Menu.Item key="add-table" icon={<TableOutlined />} onClick={() => addWidget("table")}>
                Table
              </Menu.Item>
            </SubMenu>
          )}
          {isInDashboard && (
            <SubMenu key="other-functions" icon={<AppstoreOutlined />} title="Other Functions">
              <Menu.Item key="export-pdf" icon={<DownloadOutlined />} onClick={exportDashboardAsPDF}>
                Export as PDF
              </Menu.Item>
              <Menu.Item key="email-dashboard" icon={<MailOutlined />} onClick={emailDashboard}>
                Email Dashboard
              </Menu.Item>
              <Menu.Item key="save-template" icon={<SaveOutlined />} onClick={saveAsTemplate}>
                Save as Template
              </Menu.Item>
              <Menu.Item key="save-version" icon={<SaveOutlined />} onClick={saveDashboardVersion}>
                Save Version
              </Menu.Item>
              <Menu.Item
                key="version-history"
                icon={<HistoryOutlined />}
                onClick={() => setIsVersionHistoryVisible(true)}
              >
                Version History
              </Menu.Item>
              <Menu.Item key="feedback" icon={<MailOutlined />} onClick={showFeedbackModal}>
                Feedback
              </Menu.Item>
            </SubMenu>
          )}
        </Menu>
      </Sider>
      <Layout
        style={{
          marginLeft: !isFullScreen ? (collapsed ? 80 : 250) : 0,
          transition: "margin-left 0.2s",
        }}
      >
        <ImportChartModal visible={isImportChartModalVisible} onCancel={handleImportChartModalCancel} />
        <Content style={{ margin: "12px" }}>
          <div style={{ padding: 10, background: "var(--background-color)", minHeight: 360 }}>
            {children ? children : <Outlet />}
          </div>
        </Content>
        {isInDashboard && (
          <Modal title="Submit Feedback" open={isFeedbackModalVisible} onCancel={handleFeedbackCancel} footer={null}>
            <Form form={feedbackForm} onFinish={handleFeedbackSubmit}>
              <Form.Item name="name" label="Name">
                <Input placeholder="Your name (optional)" />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
                <Input placeholder="Your email (optional)" />
              </Form.Item>
              <Form.Item name="subject" label="Subject" rules={[{ required: true, message: "Please enter a subject" }]}>
                <Input placeholder="Subject" />
              </Form.Item>
              <Form.Item
                name="message"
                label="Message"
                rules={[{ required: true, message: "Please enter your message" }]}
              >
                <Input.TextArea rows={4} placeholder="Your message" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Send Feedback
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        )}
        {isInDashboard && (
          <VersionHistoryModal visible={isVersionHistoryVisible} onClose={() => setIsVersionHistoryVisible(false)} />
        )}
        <DashboardSettingsModal visible={isSettingsModalVisible} onClose={() => setIsSettingsModalVisible(false)} />
      </Layout>
    </Layout>
  );
};
export default CustomLayout;
