// src/taskpane/components/RegisterPage.tsx

import React, { useState } from 'react';
import { Layout, Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { registerUser } from './../utils/api';

const { Content } = Layout;

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!email || !password) {
      message.error('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await registerUser(email, password);
      message.success('Registration successful. Please log in.');
      navigate('/login');
    } catch (error) {
      console.error('Error during registration:', error);
      message.error('Failed to register.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout style={{ padding: '24px', minHeight: '100vh' }}>
      <Content>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h2>Register</h2>
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
            <Button type="primary" onClick={handleRegister} loading={isLoading}>
              Register
            </Button>
          </Form>
        </div>
      </Content>
    </Layout>
  );
};

export default RegisterPage;
