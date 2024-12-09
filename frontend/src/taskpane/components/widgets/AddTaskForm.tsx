// src/taskpane/components/widgets/AddTaskForm.tsx

import React from 'react';
import { Modal, Form, Input, DatePicker, Checkbox, InputNumber } from 'antd';
import { Task } from '../types';
import moment from 'moment';

interface AddTaskFormProps {
  visible: boolean;
  onCreate: (task: Task) => void;
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

  const disabledDate = (current: moment.Moment) => {
    // Can not select days before today
    return current && current < moment().startOf('day');
  };

  return (
    <Modal
      visible={visible}
      title="Add New Task"
      okText="Add"
      cancelText="Cancel"
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            form.resetFields();
            // Transform form values into Task type
            const newTask: Task = {
              id: `task-${values.name.replace(/\s+/g, '-')}-${Date.now()}`, // Unique ID
              name: values.name,
              type: values.type || 'task', // Default to 'task' if not specified
              start: values.start.format('YYYY-MM-DD'),
              end: values.end.format('YYYY-MM-DD'),
              completedDate: values.completed ? values.completed.format('YYYY-MM-DD') : undefined,
              progress: values.progress,
              dependencies: values.dependencies || '',
              color: values.isImportant ? '#FF0000' : '#00FF00', // Red if important, green otherwise
            };
            onCreate(newTask);
            Modal.destroyAll();
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="add_task_form"
        initialValues={{ progress: 0, isImportant: false }}
      >
        <Form.Item
          name="name"
          label="Task Name"
          rules={[{ required: true, message: 'Please input the name of the task!' }]}
        >
          <Input placeholder="Enter task name" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Task Type"
          rules={[{ required: true, message: 'Please select the type of the task!' }]}
        >
          <Input placeholder="Enter task type (e.g., Task, Milestone)" />
        </Form.Item>

        <Form.Item
          name="start"
          label="Start Date"
          rules={[{ required: true, message: 'Please select the start date!' }]}
        >
          <DatePicker disabledDate={disabledDate} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="end"
          label="End Date"
          dependencies={['start']}
          rules={[
            { required: true, message: 'Please select the end date!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('start') <= value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('End date must be after start date!'));
              },
            }),
          ]}
        >
          <DatePicker disabledDate={disabledDate} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="progress"
          label="Progress (%)"
          rules={[
            { required: true, message: 'Please input the progress!' },
            {
              type: 'number',
              min: 0,
              max: 100,
              message: 'Progress must be between 0 and 100!',
            },
          ]}
        >
          <InputNumber style={{ width: '100%' }} min={0} max={100} />
        </Form.Item>

        <Form.Item name="dependencies" label="Dependencies">
          <Checkbox.Group>
            {existingTasks.map((task) => (
              <Checkbox key={task.id} value={task.name}>
                {task.name}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>

        <Form.Item
          name="isImportant"
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
