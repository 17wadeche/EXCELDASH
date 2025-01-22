// src/taskpane/components/LoginPage.tsx

import React, { useState, useContext } from 'react';
import { Layout, Form, Input, Button, message, Typography } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from './../utils/api';
import { AuthContext } from '../context/AuthContext';

const { Content } = Layout;
const { Text } = Typography;

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('AuthContext must be used within an AuthProvider');
  }

  const { setAuthState } = authContext;

  const handleLogin = async () => {
    if (!email || !password) {
      message.error('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await loginUser(email, password);
      if (response.success) {
        // Set authentication state in AuthContext
        setAuthState({
          isLoggedIn: true,
          isVerified: false, // Will be set after verification
          isLoading: true,   // Indicates verification in progress
        });
        message.success('Login successful.');
        // Proceed to verification inside AuthContext
      } else {
        message.error(response.message || 'Login failed.');
        setAuthState({
          isLoggedIn: false,
          isVerified: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error during login:', error);
      message.error('Failed to login.');
      setAuthState({
        isLoggedIn: false,
        isVerified: false,
        isLoading: false,
      });
    }
  };

  return (
    <Layout style={{ padding: '24px', minHeight: '100vh' }}>
      <Content>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          <Typography.Title level={2}>Login</Typography.Title>
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
            <Form.Item
              rules={[
                { required: true, message: 'Please enter your password' },
              ]}
            >
              <Input.Password
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                onClick={handleLogin}
                loading={isLoading}
                block
              >
                Login
              </Button>
            </Form.Item>
            <Form.Item>
              <Text>
                Forgot your password? <Link to="/forgot-password">Reset Password</Link>
              </Text>
            </Form.Item>
          </Form>
        </div>
      </Content>
    </Layout>
  );
};

export default LoginPage;
