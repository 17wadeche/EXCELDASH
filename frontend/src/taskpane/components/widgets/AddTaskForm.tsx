// src/taskpane/components/widgets/AddTaskForm.tsx

import React, { useContext, useMemo } from 'react';
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

  const { addTaskToGantt, widgets } = dashboardContext;
  const existingTaskNames = useMemo(() => {
    const ganttWidget = widgets.find(w => w.type === 'gantt');
    if (!ganttWidget) return [];
    const ganttData = ganttWidget.data;
    return ganttData.tasks.map((t: Task) => t.name);
  }, [widgets]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const startDate = moment(values.start);
      const endDate = moment(values.end);
      const completed = values.completed ? moment(values.completed) : null;
      const duration = endDate.diff(startDate, 'days');
      const newTask: Task = {
        id: `task-${uuidv4()}`,
        name: values.name,
        type: values.type,
        start: values.start.format('YYYY-MM-DD'),
        end: values.end.format('YYYY-MM-DD'),
        completed: completed ? completed.format('YYYY-MM-DD') : undefined,
        progress: values.progress,
        dependencies: values.dependencies?.join(',') || '',
        color: values.color,
        duration,
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
          name="completed"
          label="Completed Date"
          tooltip="If the task is already completed, pick a date"
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
        <Form.Item name="dependencies" label="Dependencies">
          <Select
            mode="multiple"
            placeholder="Select dependencies"
            allowClear
          >
            {existingTaskNames.map(taskName => (
              <Option key={taskName} value={taskName}>
                {taskName}
              </Option>
            ))}
          </Select>
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
