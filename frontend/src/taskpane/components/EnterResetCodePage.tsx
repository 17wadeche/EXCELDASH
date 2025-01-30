/* eslint-disable no-undef */
// src/taskpane/components/EnterResetCodePage.tsx

import React, { useState } from "react";
import { Layout, Form, Input, Button, message, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../utils/api"; // same function you already have

const { Content } = Layout;
const { Title, Text } = Typography;

const EnterResetCodePage: React.FC = () => {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      message.error("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(code, newPassword);
      message.success("Password has been reset successfully.");
      navigate("/login");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      message.error("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Layout style={{ padding: "24px", minHeight: "100vh" }}>
      <Content>
        <div style={{ maxWidth: "400px", margin: "0 auto", textAlign: "center" }}>
          <Title level={2}>Enter Your Reset Code</Title>
          <Text>Please check your email for a 6-digit code.</Text>
          <Form style={{ marginTop: "24px" }}>
            <Form.Item label="Reset Code" required>
              <Input placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
            </Form.Item>
            <Form.Item label="New Password" required>
              <Input.Password
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Confirm Password" required>
              <Input.Password
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleResetPassword} loading={isLoading} block>
                Reset Password
              </Button>
            </Form.Item>
            <Form.Item>
              <Button type="link" onClick={() => navigate("/login")}>
                Back to Login
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
    </Layout>
  );
};

export default EnterResetCodePage;
