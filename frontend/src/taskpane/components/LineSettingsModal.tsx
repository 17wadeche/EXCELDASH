// src/taskpane/components/LineSettingsModal.tsx

import React from "react";
import { Modal, Slider, Select } from "antd";
import { SketchPicker } from "react-color";
import { LineWidgetData } from "./types";

const { Option } = Select;

interface LineSettingsModalProps {
  visible: boolean;
  data: LineWidgetData;
  onSave: (data: LineWidgetData) => void;
  onCancel: () => void;
}

const LineSettingsModal: React.FC<LineSettingsModalProps> = ({ visible, data, onSave, onCancel }) => {
  const [lineData, setLineData] = React.useState<LineWidgetData>(data);
  const handleColorChange = (color: any) => {
    setLineData({ ...lineData, color: color.hex });
  };
  const handleThicknessChange = (value: number) => {
    setLineData({ ...lineData, thickness: value });
  };
  const handleStyleChange = (value: "solid" | "dashed" | "dotted") => {
    setLineData({ ...lineData, style: value });
  };
  const handleOrientationChange = (value: "horizontal" | "vertical") => {
    setLineData({ ...lineData, orientation: value });
  };
  return (
    <Modal open={visible} onOk={() => onSave(lineData)} onCancel={onCancel} title="Line Settings">
      <div style={{ marginBottom: 16 }}>
        <span>Line Color:</span>
        <SketchPicker color={lineData.color} onChange={handleColorChange} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <span>Line Thickness (px):</span>
        <Slider min={0.1} max={20} step={0.1} value={lineData.thickness} onChange={handleThicknessChange} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <span>Line Style:</span>
        <Select value={lineData.style} onChange={handleStyleChange} style={{ width: "100%" }}>
          <Option value="solid">Solid</Option>
          <Option value="dashed">Dashed</Option>
          <Option value="dotted">Dotted</Option>
        </Select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <span>Orientation:</span>
        <Select value={lineData.orientation} onChange={handleOrientationChange} style={{ width: "100%" }}>
          <Option value="horizontal">Horizontal</Option>
          <Option value="vertical">Vertical</Option>
        </Select>
      </div>
    </Modal>
  );
};

export default LineSettingsModal;
