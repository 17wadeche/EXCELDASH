// src/taskpane/components/widgets/ImageWidget.tsx

import React from "react";
import { ImageWidgetData } from "../types";

interface ImageWidgetProps {
  data: ImageWidgetData;
}

const ImageWidget: React.FC<ImageWidgetProps> = ({ data }) => {
  return (
    <div
      className="drag-handle"
      style={{
        padding: "0px",
        height: "100%",
        position: "relative",
        cursor: "move",
      }}
    >
      <img src={data.src} alt="Imported Chart" style={{ width: "100%" }} />
    </div>
  );
};

export default ImageWidget;
