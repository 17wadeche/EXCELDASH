// src/taskpane/components/LoginPage.tsx

import React, { useState } from 'react';
import { Layout, Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { loginUser, checkSubscription, checkRegistration } from './../utils/api';

const { Content } = Layout;

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      message.error('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await loginUser(email, password);
      message.success('Login successful.');
      // After login, check registration and subscription
      const isRegistered = await checkRegistration(email);
      if (!isRegistered.registered) {
        navigate('/register');
        return;
      }
      const subscriptionStatus = await checkSubscription(email);
      if (!subscriptionStatus.subscribed) {
        navigate('/subscribe');
        return;
      }
      navigate('/create');
    } catch (error) {
      console.error('Error during login:', error);
      message.error('Failed to login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout style={{ padding: '24px', minHeight: '100vh' }}>
      <Content>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h2>Login</h2>
          <Form>
            <Form.Item
              rules={[{ required: true, message: 'Please enter your email' }]}
            >
              <Input
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Item>
            <Form.Item
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
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
};

export default LoginPage;
