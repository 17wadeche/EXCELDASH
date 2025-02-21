/* eslint-disable no-undef */
// src/taskpane/components/ForgotPasswordPage.tsx
import React, { useState } from "react";
import { Layout, Form, Input, Button, message, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "./../utils/api";

const { Content } = Layout;
const { Title, Text } = Typography;

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const handleRequestReset = async () => {
    if (!email) {
      message.error("Please enter your email.");
      return;
    }
    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      message.success("If that email is in our system, we have sent a password reset code.");
      navigate("/enter-code");
    } catch (error: any) {
      console.error("Error requesting password reset:", error);
      message.error("Failed to send password reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Layout style={{ padding: "24px", minHeight: "100vh" }}>
      <Content>
        <div style={{ maxWidth: "400px", margin: "0 auto", textAlign: "center" }}>
          <Title level={2}>Forgot Password</Title>
          <Text>Enter your email address to receive a 6-digit password reset code.</Text>
          <Form style={{ marginTop: "24px" }}>
            <Form.Item
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleRequestReset} loading={isLoading} block>
                Send Reset Code
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

export default ForgotPasswordPage;
