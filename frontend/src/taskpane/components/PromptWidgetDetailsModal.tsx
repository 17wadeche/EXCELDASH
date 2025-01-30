/* eslint-disable no-undef */
// src/taskpane/components/PromptWidgetDetailsModal.tsx

import React from "react";
import { Modal, Form, Input } from "antd";
import { Widget } from "./types";

interface PromptWidgetDetailsModalProps {
  widget: Widget;
  onComplete: (updatedWidget: Widget) => void;
  onCancel: () => void;
}

const PromptWidgetDetailsModal: React.FC<PromptWidgetDetailsModalProps> = ({ widget, onComplete, onCancel }) => {
  const [form] = Form.useForm();
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const updatedWidget: Widget = {
          ...widget,
          data: {
            ...widget.data,
            ...values,
          },
        };
        onComplete(updatedWidget);
        form.resetFields();
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };
  return (
    <Modal
      open={true}
      title={`Provide Details for ${widget.type.charAt(0).toUpperCase() + widget.type.slice(1)} Widget`}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Save"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          worksheetName: "",
          cellAddress: "",
          associatedRange: "",
        }}
      >
        {widget.type === "metric" && (
          <>
            <Form.Item
              name="worksheetName"
              label="Worksheet Name"
              rules={[{ required: true, message: "Please enter the worksheet name" }]}
            >
              <Input placeholder="e.g., Sheet1" />
            </Form.Item>
            <Form.Item
              name="cellAddress"
              label="Cell Address"
              rules={[
                { required: true, message: "Please enter the cell address" },
                {
                  pattern: /^[A-Za-z]{1,3}[1-9][0-9]{0,6}$/,
                  message: "Please enter a valid cell address (e.g., A1, B2)",
                },
              ]}
            >
              <Input placeholder="e.g., A1" />
            </Form.Item>
          </>
        )}
        {widget.type === "image" && (
          <>
            <Form.Item
              name="worksheetName"
              label="Worksheet Name"
              rules={[{ required: true, message: "Please enter the worksheet name" }]}
            >
              <Input placeholder="e.g., Sheet1" />
            </Form.Item>
            <Form.Item
              name="associatedRange"
              label="Associated Range"
              rules={[
                { required: true, message: "Please enter the associated range" },
                {
                  pattern: /^[A-Za-z]{1,3}[1-9][0-9]{0,6}:[A-Za-z]{1,3}[1-9][0-9]{0,6}$/,
                  message: "Please enter a valid range (e.g., A1:B10)",
                },
              ]}
            >
              <Input placeholder="e.g., A1:B10" />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default PromptWidgetDetailsModal;
