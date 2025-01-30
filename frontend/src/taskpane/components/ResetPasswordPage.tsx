/* eslint-disable no-undef */
// src/taskpane/components/ResetPasswordPage.tsx

import React, { useState } from "react";
import { Layout, Form, Input, Button, message, Typography } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "./../utils/api";

const { Content } = Layout;
const { Title, Text } = Typography;

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const token = query.get("token");

  if (!token) {
    message.error("Invalid or missing token.");
    navigate("/login");
    return null;
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      message.error("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
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
          <Title level={2}>Reset Password</Title>
          <Text>Enter your new password below.</Text>
          <Form style={{ marginTop: "24px" }}>
            <Form.Item
              label="New Password"
              rules={[
                { required: true, message: "Please enter your new password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Item>
            <Form.Item
              label="Confirm New Password"
              rules={[
                { required: true, message: "Please confirm your new password" },
                {
                  validator: (_, value) =>
                    value === newPassword ? Promise.resolve() : Promise.reject(new Error("Passwords do not match")),
                },
              ]}
            >
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

export default ResetPasswordPage;
