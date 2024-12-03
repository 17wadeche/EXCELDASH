import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { registerUser } from '../utils/api';

interface RegistrationFormProps {
  onRegistrationSuccess: () => void;
}

interface AuthFormValues {
  email: string;
  password: string;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegistrationSuccess }) => {
  const [form] = Form.useForm();

  const handleRegister = async (values: AuthFormValues) => {
    try {
      await registerUser(values.email, values.password);
      message.success('Registration successful.');
      onRegistrationSuccess();
    } catch (error) {
      message.error('Registration failed.');
    }
  };

  return (
    <Form form={form} onFinish={handleRegister}>
      <Form.Item
        name="email"
        rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
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
        Register
      </Button>
    </Form>
  );
};

export default RegistrationForm;
