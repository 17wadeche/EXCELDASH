// src/taskpane/components/widgets/LineWidget.tsx

import React from "react";
import { LineWidgetData } from "../types";

interface LineWidgetProps {
  data: LineWidgetData;
}

const LineWidget: React.FC<LineWidgetProps> = ({ data }) => {
  const { color, thickness, style, orientation } = data;

  let lineStyle: React.CSSProperties = {
    backgroundColor: color,
  };

  if (orientation === "horizontal") {
    lineStyle = {
      position: "absolute",
      top: "50%",
      left: 0,
      width: "100%",
      transform: "translateY(-50%)",
      borderTopStyle: style,
      borderTopWidth: `${thickness}px`,
      borderTopColor: color,
    };
  } else {
    lineStyle = {
      position: "absolute",
      left: "50%",
      top: 0,
      height: "100%",
      transform: "translateX(-50%)",
      borderLeftStyle: style,
      borderLeftWidth: `${thickness}px`,
      borderLeftColor: color,
    };
  }

  return (
    <div
      className="drag-handle"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        padding: 0,
        margin: 0,
        boxShadow: "none",
        cursor: "move",
      }}
    >
      <div style={lineStyle} />
    </div>
  );
};

export default LineWidget;
