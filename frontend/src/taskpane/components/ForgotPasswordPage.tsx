// src/taskpane/components/ForgotPasswordPage.tsx

import React, { useState } from 'react';
import { Layout, Form, Input, Button, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from './../utils/api';

const { Content } = Layout;
const { Title, Text } = Typography;

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleRequestReset = async () => {
    if (!email) {
      message.error('Please enter your email.');
      return;
    }
    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      message.success('Password reset link has been sent to your email.');
      navigate('/login');
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      message.error('Failed to send password reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout style={{ padding: '24px', minHeight: '100vh' }}>
      <Content>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          <Title level={2}>Forgot Password</Title>
          <Text>Enter your email address to receive a password reset link.</Text>
          <Form style={{ marginTop: '24px' }}>
            <Form.Item
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                onClick={handleRequestReset}
                loading={isLoading}
                block
              >
                Send Reset Link
              </Button>
            </Form.Item>
            <Form.Item>
              <Button type="link" onClick={() => navigate('/login')}>
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
