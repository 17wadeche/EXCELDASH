// src/taskpane/components/widgets/AddTaskForm.tsx

import React from 'react';
import { Modal, Form, Input, DatePicker, Checkbox } from 'antd';
import { Task } from '../types';

interface AddTaskFormProps {
  visible: boolean;
  onCreate: (task: any) => void;
  onCancel: () => void;
  existingTasks: Task[];
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({
  visible,
  onCreate,
  onCancel,
  existingTasks,
}) => {
  const [form] = Form.useForm();
  return (
    <Modal
      open={visible}
      title="Add New Task"
      okText="Add"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => {
        form.validateFields().then((values) => {
          form.resetFields();
          onCreate(values);
        });
      }}
    >
      <Form form={form} layout="vertical" name="add_task_form">
        <Form.Item name="name" label="Task Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="start" label="Start Date" rules={[{ required: true }]}>
          <DatePicker />
        </Form.Item>
        <Form.Item name="end" label="End Date" rules={[{ required: true }]}>
          <DatePicker />
        </Form.Item>
        <Form.Item
          name="progress"
          label="Progress"
          rules={[{ required: true }]}
          initialValue={0}
        >
          <Input type="number" min={0} max={100} />
        </Form.Item>
        <Form.Item name="dependencies" label="Dependencies">
          <Checkbox.Group>
            {existingTasks.map((task) => (
              <Checkbox key={task.id} value={task.id}>
                {task.name}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>
        <Form.Item
          name="custom_class"
          valuePropName="checked"
          initialValue={false}
        >
          <Checkbox>Is Important?</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default AddTaskForm;
