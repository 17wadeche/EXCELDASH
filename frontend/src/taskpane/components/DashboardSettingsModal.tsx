import React, { useContext } from "react";
import { Modal, Checkbox, Slider, Select, Button, InputNumber } from "antd";
import { SketchPicker } from "react-color";
import { DashboardContext } from "../context/DashboardContext";

const { Option } = Select;

type BorderStyleType = "solid" | "dashed" | "dotted";

interface DashboardSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const DashboardSettingsModal: React.FC<DashboardSettingsModalProps> = ({ visible, onClose }) => {
  const dashboardContext = useContext(DashboardContext);
  if (!dashboardContext) {
    throw new Error("DashboardContext must be used within a DashboardProvider");
  }
  const { dashboardBorderSettings, setDashboardBorderSettings } = dashboardContext;
  const handleBorderToggle = (e: any) => {
    setDashboardBorderSettings({
      ...dashboardBorderSettings,
      showBorder: e.target.checked,
    });
  };
  const handleColorChange = (color: any) => {
    setDashboardBorderSettings({
      ...dashboardBorderSettings,
      color: color.hex,
    });
  };
  const handleThicknessChange = (value: number) => {
    setDashboardBorderSettings({
      ...dashboardBorderSettings,
      thickness: value,
    });
  };
  const handleStyleChange = (value: BorderStyleType) => {
    setDashboardBorderSettings({
      ...dashboardBorderSettings,
      style: value,
    });
  };
  const handleBackgroundColorChange = (color: any) => {
    setDashboardBorderSettings({
      ...dashboardBorderSettings,
      backgroundColor: color.hex,
    });
  };

  const handleWidthChange = (value: number | null) => {
    setDashboardBorderSettings({
      ...dashboardBorderSettings,
      width: value ?? 733,
    });
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      title="Dashboard Settings"
    >
      <Checkbox checked={dashboardBorderSettings.showBorder} onChange={handleBorderToggle}>
        Show Border
      </Checkbox>
      {dashboardBorderSettings.showBorder && (
        <div style={{ marginTop: 16 }}>
          <div>
            <span>Border Color:</span>
            <SketchPicker color={dashboardBorderSettings.color} onChange={handleColorChange} />
          </div>
          <div style={{ marginTop: 16 }}>
            <span>Border Thickness (px):</span>
            <Slider min={1} max={10} value={dashboardBorderSettings.thickness} onChange={handleThicknessChange} />
          </div>
          <div style={{ marginTop: 16 }}>
            <span>Border Style:</span>
            <Select
              value={dashboardBorderSettings.style}
              onChange={(value) => handleStyleChange(value as BorderStyleType)}
              style={{ width: "100%" }}
            >
              <Option value="solid">Solid</Option>
              <Option value="dashed">Dashed</Option>
              <Option value="dotted">Dotted</Option>
            </Select>
          </div>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <span>Background Color:</span>
        <SketchPicker
          color={dashboardBorderSettings.backgroundColor || "#ffffff"}
          onChange={handleBackgroundColorChange}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <span>Dashboard Width (px):</span>
        <InputNumber
          min={300}
          max={733}
          step={50}
          style={{ width: "100%" }}
          value={dashboardBorderSettings.width ?? 733}
          onChange={handleWidthChange}
        />
      </div>
    </Modal>
  );
};

export default DashboardSettingsModal;
