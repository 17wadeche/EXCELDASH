// src/taskpane/components/TextFormComponent.tsx

import React from 'react';
import { Form, Input, InputNumber } from 'antd';
import { SketchPicker } from 'react-color';

const TextFormComponent: React.FC = () => {
  return (
    <>
      <Form.Item
        name="content"
        label="Content"
        rules={[{ required: true, message: 'Please enter the content' }]}
      >
        <Input.TextArea placeholder="Enter text content" />
      </Form.Item>
      <Form.Item
        name="textColor"
        label="Text Color"
      >
        <SketchPicker />
      </Form.Item>
      <Form.Item
        name="backgroundColor"
        label="Background Color"
      >
        <SketchPicker />
      </Form.Item>
      <Form.Item
        name="fontSize"
        label="Font Size"
        rules={[{ required: true, message: 'Please enter the font size' }]}
      >
        <InputNumber placeholder="Enter font size" min={1} />
      </Form.Item>
    </>
  );
};

export default TextFormComponent;
