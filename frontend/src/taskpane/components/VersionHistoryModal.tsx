// src/taskpane/components/VersionHistoryModal.tsx

import React, { useContext } from "react";
import { Modal, List, Button } from "antd";
import { DashboardContext } from "../context/DashboardContext";
import { DashboardVersion, DashboardItem } from "../components/types";
interface VersionHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}
const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ visible, onClose }) => {
  const dashboardContext = useContext(DashboardContext);
  if (!dashboardContext) {
    return null;
  }
  const { dashboards, currentDashboardId, restoreDashboardVersion } = dashboardContext;
  if (!currentDashboardId) {
    return null;
  }
  const currentDashboard = dashboards.find((d: DashboardItem) => d.id === currentDashboardId);
  if (!currentDashboard || !currentDashboard.versions) {
    return null;
  }
  const versions = currentDashboard.versions;
  return (
    <Modal title="Version History" open={visible} onCancel={onClose} footer={null}
    >
      <List
        dataSource={versions.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))}
        renderItem={(version: DashboardVersion) => (
          <List.Item
            actions={[
              <Button onClick={() => restoreDashboardVersion(version.id)} type="primary">
                Restore
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={`Version from ${new Date(version.timestamp).toLocaleString()}`}
              description={`Title: ${version.title}`}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};
export default VersionHistoryModal;
