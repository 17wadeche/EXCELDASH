import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { loginUser } from '../utils/api';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

interface AuthFormValues {
  email: string;
  password: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [form] = Form.useForm();

  const handleLogin = async (values: AuthFormValues) => {
    try {
      const token = await loginUser(values.email, values.password);
      localStorage.setItem('token', token);
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
        rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
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
