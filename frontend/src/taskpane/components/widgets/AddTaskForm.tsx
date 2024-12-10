// src/taskpane/components/widgets/AddTaskForm.tsx

import React, { useState } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber } from 'antd';
import { SketchPicker, ColorResult } from 'react-color';
import '../Dashboard.css';

interface AddTaskFormProps {
  visible: boolean;
  onCreate: (values: any) => void;
  onCancel: () => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ visible, onCreate, onCancel }) => {
  const [form] = Form.useForm();
  const [color, setColor] = useState<string>('#FF4D4F'); // Default color

  const handleColorChange = (colorResult: ColorResult) => {
    setColor(colorResult.hex);
    form.setFieldsValue({ color: colorResult.hex });
  };

  return (
    <Modal
      visible={visible}
      title="Add New Task"
      okText="Add"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then(values => {
            form.resetFields();
            onCreate(values);
          })
          .catch(info => {
            console.log('Validation Failed:', info);
          });
      }}
    >
      <Form form={form} layout="vertical" name="form_in_modal">
        <Form.Item
          name="name"
          label="Task Name"
          rules={[{ required: true, message: 'Please enter the task name!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="start"
          label="Start Date"
          rules={[{ required: true, message: 'Please select the start date!' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="end"
          label="End Date"
          rules={[{ required: true, message: 'Please select the end date!' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="progress"
          label="Progress (%)"
          rules={[{ required: true, message: 'Please enter the progress!' }]}
        >
          <InputNumber min={0} max={100} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="dependencies"
          label="Dependencies"
          tooltip="Comma-separated list of task IDs"
        >
          <Input placeholder="e.g., task-1, task-2" />
        </Form.Item>
        <Form.Item
          name="color"
          label="Task Color"
          initialValue={color}
          rules={[{ required: true, message: 'Please select a color!' }]}
        >
          {/* Hidden input to store the color value */}
          <Input type="hidden" />
        </Form.Item>
        <Form.Item label="Choose Color">
          <SketchPicker color={color} onChangeComplete={handleColorChange} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddTaskForm;
