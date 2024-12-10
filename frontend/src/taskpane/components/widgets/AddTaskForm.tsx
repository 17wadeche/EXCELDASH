// src/taskpane/components/widgets/AddTaskForm.tsx

import React, { useContext } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Select, Button } from 'antd';
import { DashboardContext } from '../../context/DashboardContext';
import { Task } from '../types';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

const { Option } = Select;

interface AddTaskFormProps {
  visible: boolean;
  onCancel: () => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const dashboardContext = useContext(DashboardContext);

  if (!dashboardContext) {
    console.error('DashboardContext is undefined');
    return null;
  }

  const { addTaskToGantt } = dashboardContext;

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const newTask: Task = {
        id: `task-${uuidv4()}`,
        name: values.name,
        type: values.type,
        start: values.start.format('YYYY-MM-DD'),
        end: values.end.format('YYYY-MM-DD'),
        progress: values.progress,
        dependencies: values.dependencies ? values.dependencies.split(',').map((dep: string) => dep.trim()) : [],
        color: values.color,
      };
      await addTaskToGantt(newTask);
      form.resetFields();
      onCancel();
    } catch (error) {
      console.log('Validate Failed or Add Task Failed:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      title="Add New Task"
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          Add
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" name="add_task_form">
        <Form.Item
          name="name"
          label="Task Name"
          rules={[{ required: true, message: 'Please enter the task name' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="type"
          label="Task Type"
          rules={[{ required: true, message: 'Please select the task type' }]}
        >
          <Select placeholder="Select task type">
            <Option value="task">Task</Option>
            <Option value="milestone">Milestone</Option>
            <Option value="project">Project</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="start"
          label="Start Date"
          rules={[{ required: true, message: 'Please select the start date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="end"
          label="End Date"
          rules={[{ required: true, message: 'Please select the end date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="progress"
          label="Progress (%)"
          rules={[{ required: true, message: 'Please enter the progress' }]}
        >
          <InputNumber min={0} max={100} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="dependencies"
          label="Dependencies"
          tooltip="Comma-separated list of task names"
        >
          <Input placeholder="e.g., Design Interface, Develop Backend" />
        </Form.Item>
        <Form.Item
          name="color"
          label="Task Color"
          rules={[{ required: true, message: 'Please select a color' }]}
          initialValue="#FF0000"
        >
          <Input type="color" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddTaskForm;
