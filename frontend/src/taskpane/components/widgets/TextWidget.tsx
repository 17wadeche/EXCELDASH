// src/taskpane/components/widgets/TextWidget.tsx

import React, { useState } from "react";
import { TextData } from "../../components/types";
import { Card } from "antd";
import { DragOutlined } from "@ant-design/icons";

interface TextWidgetProps {
  data: TextData;
  onUpdate?: (updatedData: Partial<TextData>) => void; // Optional
}
const TextWidget: React.FC<TextWidgetProps> = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Card
      className="text-widget widget-card"
      bordered={false}
      style={{
        backgroundColor: data.backgroundColor || "white", // Applies to the entire Card
        boxShadow: "none",
        border: "none",
        padding: 0,
        margin: 0,
      }}
      bodyStyle={{
        backgroundColor: data.backgroundColor || "white", // Applies to the Card"s body
        padding: "0px", // Remove padding from body
        borderTop: "none", // Ensure no top border on the body
      }}
    >
      <div
        className="drag-handle text-widget-header"
        style={{
          backgroundColor: data.backgroundColor || "white", // Ensure header background color
          cursor: "move", // Indicates draggable area
          padding: "8px 12px", // Padding for better aesthetics
          borderBottom: "none", // Explicitly set no border
          position: "relative", // For positioning child elements if needed
          display: "flex",
          alignItems: "center",
        }}
        // Event handlers to track hover state
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <DragOutlined
            style={{
              marginRight: "8px", // Space between icon and other elements
              transition: "opacity 0.3s ease", // Smooth transition
            }}
          />
        )}
      </div>
      <div
        className="text-content"
        style={{
          color: data.textColor || "#000000",
          fontSize: data.fontSize ? `${data.fontSize}px` : "inherit",
          padding: "12px", // Padding for better layout
          textAlign: data.titleAlignment || "center",
        }}
      >
        {data.content}
      </div>
    </Card>
  );
};

export default React.memo(TextWidget);
