/* eslint-disable no-undef */
// src/taskpane/components/SelectRangeButton.tsx

import React, { useContext } from "react";
import { Button, message } from "antd";
import { DashboardContext } from "../context/DashboardContext";

const SelectRangeButton: React.FC = () => {
  const dashboardContext = useContext(DashboardContext);
  if (!dashboardContext) {
    return null;
  }
  const { setSelectedRangeAddress } = dashboardContext;
  const handleSelectRange = async () => {
    try {
      await Excel.run(async (context) => {
        const selectedRange = context.workbook.getSelectedRange();
        selectedRange.load("address");
        await context.sync();
        setSelectedRangeAddress(selectedRange.address);
        message.success(`Selected range set to ${selectedRange.address}`);
      });
    } catch (error) {
      console.error("Error selecting range:", error);
      message.error("Failed to select range.");
    }
  };
  return (
    <Button type="primary" onClick={handleSelectRange}>
      Select Range for Refreshing Charts
    </Button>
  );
};

export default SelectRangeButton;
