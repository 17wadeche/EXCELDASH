// src/taskpane/components/EditDeleteButtons.tsx

import React from "react";
import { Button, Space } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { DashboardItem } from "./types";

interface EditDeleteButtonsProps {
  dashboard: DashboardItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
const EditDeleteButtons: React.FC<EditDeleteButtonsProps> = ({ dashboard, onEdit, onDelete }) => {
  return (
    <Space>
      <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(dashboard.id)}>
        Edit
      </Button>
      <Button type="primary" danger icon={<DeleteOutlined />} onClick={() => onDelete(dashboard.id)}>
        Delete
      </Button>
    </Space>
  );
};

export default EditDeleteButtons;
