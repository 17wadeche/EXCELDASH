import React, { useState, useEffect } from "react";
import { Button, Table, Input } from "antd";
import { ColumnsType } from "antd/es/table";
import { TableData } from "../types";

interface TableWidgetProps {
  id: string;
  name: string;
  data: TableData;
  onUpdateName?: (id: string, newName: string) => void;
  onRefresh?: (id: string) => void;
}

const TableWidgetComponent: React.FC<TableWidgetProps> = ({ id, name, data, onUpdateName, onRefresh }) => {
  const [title, setTitle] = useState(name);
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    setTitle(name);
  }, [name]);
  const handleBlur = () => {
    if (onUpdateName) {
      onUpdateName(id, title);
    }
    setIsEditing(false);
  };
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div
        className="drag-handle"
        style={{
          cursor: "move",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
        }}
      >
        {onRefresh && (
          <Button size="small" onClick={() => onRefresh(id)}>
            Refresh
          </Button>
        )}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          {isEditing ? (
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlur}
              onPressEnter={handleBlur}
              style={{ width: "70%" }}
            />
          ) : (
            <h3
              style={{
                cursor: "pointer",
                margin: 0,
                textAlign: "center",
              }}
              onClick={() => setIsEditing(true)}
            >
              {title}
            </h3>
          )}
        </div>
      </div>
      <Table
        columns={data.columns as ColumnsType<any>}
        dataSource={data.data}
        pagination={false}
        rowKey="key"
        style={{ width: "100%" }}
      />
    </div>
  );
};

export default TableWidgetComponent;
