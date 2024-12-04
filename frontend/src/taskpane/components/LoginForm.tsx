// src/taskpane/components/LoginForm.tsx
import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { loginUser } from '../utils/api';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [form] = Form.useForm();

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const token = await loginUser(values.email, values.password);
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', values.email);
      message.success('Login successful.');
      onLoginSuccess();
    } catch (error) {
      message.error('Login failed.');
    }
  };

  return (
    <Form form={form} onFinish={handleLogin}>
      <Form.Item
        name="email"
        rules={[{ required: true, type: 'email', message: 'Please input your email!' }]}
      >
        <Input placeholder="Email" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please input your password!' }]}
      >
        <Input.Password placeholder="Password" />
      </Form.Item>
      <Button type="primary" htmlType="submit">
        Login
      </Button>
    </Form>
  );
};

export default LoginForm;
