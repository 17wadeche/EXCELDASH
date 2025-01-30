// src/taskpane/components/widgets/TextWidget.tsx

import React, { useState } from "react";
import { TextData } from "../../components/types";
import { Card } from "antd";
import { DragOutlined } from "@ant-design/icons";

interface TextWidgetProps {
  data: TextData;
  onUpdate?: (updatedData: Partial<TextData>) => void;
}
const TextWidget: React.FC<TextWidgetProps> = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Card
      className="text-widget widget-card"
      bordered={false}
      style={{
        backgroundColor: data.backgroundColor || "white",
        boxShadow: "none",
        border: "none",
        padding: 0,
        margin: 0,
      }}
      bodyStyle={{
        backgroundColor: data.backgroundColor || "white",
        padding: "0px",
        borderTop: "none",
      }}
    >
      <div
        className="drag-handle text-widget-header"
        style={{
          backgroundColor: data.backgroundColor || "white",
          cursor: "move",
          padding: "8px 12px",
          borderBottom: "none",
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <DragOutlined
            style={{
              marginRight: "8px",
              transition: "opacity 0.3s ease",
            }}
          />
        )}
      </div>
      <div
        className="text-content"
        style={{
          color: data.textColor || "#000000",
          fontSize: data.fontSize ? `${data.fontSize}px` : "inherit",
          padding: "12px",
          textAlign: data.titleAlignment || "center",
        }}
      >
        {data.content}
      </div>
    </Card>
  );
};

export default React.memo(TextWidget);
