// src/taskpane/components/EditTemplate.tsx
import React, { useEffect, useState, useContext } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardContext } from '../context/DashboardContext';
import { DashboardItem } from './types'; 

const EditTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { dashboards, editDashboard, saveAsTemplate } = useContext(DashboardContext)!;
  const navigate = useNavigate();
  const [template, setTemplate] = useState<DashboardItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const existingTemplate = dashboards.find((d) => d.id === id);
    if (existingTemplate) {
      setTemplate(existingTemplate);
      form.setFieldsValue(existingTemplate);
    } else {
      message.error('Template not found!');
      navigate('/dashboard-list');
    }
  }, [id, dashboards, form, navigate]);
  const onFinish = (values: any) => {
    const { title, components } = values;
    if (!template) {
      message.error('Template data is missing.');
      return;
    }
    const updatedTemplate: DashboardItem = {
      ...template,
      title,
      components,
      layouts: template.layouts,
      userEmail: template.userEmail,
    };
    editDashboard(updatedTemplate);
    saveAsTemplate();
    message.success('Template updated successfully!');
    navigate('/dashboard-list');
  };
  if (!template) {
    return <div>Loading...</div>;
  }
  return (
    <Form
      form={form}
      name="edit_template"
      onFinish={onFinish}
      layout="vertical"
      initialValues={{
        title: template.title,
        components: template.components,
      }}
    >
      <Form.Item
        name="title"
        label="Template Title"
        rules={[{ required: true, message: 'Please enter the template title' }]}
      >
        <Input placeholder="Enter template title" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Update Template
        </Button>
      </Form.Item>
    </Form>
  );
};
export default EditTemplate;
