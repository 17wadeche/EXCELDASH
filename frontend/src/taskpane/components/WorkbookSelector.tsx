/* eslint-disable office-addins/no-context-sync-in-loop */
/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { Select, Alert, Form } from "antd";

const { Option } = Select;

interface WorkbookInfo {
  id: string;
  name: string;
  worksheets: string[];
}

interface WorkbookSelectorProps {
  onWorkbookSelect: (workbookId: string) => void;
  onWorksheetSelect: (worksheet: string) => void;
  selectedWorkbookId?: string;
  selectedWorksheet?: string;
}

const getAllOpenWorkbooks = async (): Promise<WorkbookInfo[]> => {
  try {
    return await Excel.run(async (context) => {
      const workbooks = context.workbooks.load("items");
      await context.sync();
      const workbookInfos: WorkbookInfo[] = [];
      for (const workbook of workbooks.items) {
        workbook.load("name");
        const worksheets = workbook.worksheets.load("items");
        await context.sync();
        const customProps = workbook.properties.custom;
        const idProp = customProps.getItemOrNullObject("dashboardWorkbookId");
        await context.sync();
        let workbookId: string;
        if (idProp.isNullObject) {
          workbookId = crypto.randomUUID().toLowerCase();
          customProps.add("dashboardWorkbookId", workbookId);
          await context.sync();
        } else {
          idProp.load("value");
          await context.sync();
          workbookId = idProp.value?.toString().toLowerCase() || crypto.randomUUID().toLowerCase();
        }
        workbookInfos.push({
          id: workbookId,
          name: workbook.name,
          worksheets: worksheets.items.map((ws: any) => ws.name),
        });
      }
      return workbookInfos;
    });
  } catch (error) {
    console.error("Error getting open workbooks:", error);
    return [];
  }
};

const WorkbookSelector: React.FC<WorkbookSelectorProps> = ({
  onWorkbookSelect,
  onWorksheetSelect,
  selectedWorkbookId,
  selectedWorksheet,
}) => {
  const [workbooks, setWorkbooks] = useState<WorkbookInfo[]>([]);
  const [selectedWorkbookInfo, setSelectedWorkbookInfo] = useState<WorkbookInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkbooks = async () => {
      try {
        const openWorkbooks = await getAllOpenWorkbooks();
        setWorkbooks(openWorkbooks);
        setError(null);
        if (selectedWorkbookId) {
          const selected = openWorkbooks.find((wb: any) => wb.id === selectedWorkbookId);
          if (selected) {
            setSelectedWorkbookInfo(selected);
          }
        }
      } catch (err) {
        setError("Failed to load workbooks. Please try again.");
        console.error("Error loading workbooks:", err);
      }
    };
    loadWorkbooks();
  }, [selectedWorkbookId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {error && <Alert message="Error" description={error} type="error" showIcon closable />}
      <Form.Item label="Workbook">
        <Select
          value={selectedWorkbookId}
          onChange={(value) => {
            const selected = workbooks.find((wb: any) => wb.id === value);
            setSelectedWorkbookInfo(selected || null);
            onWorkbookSelect(value);
          }}
          placeholder="Select workbook"
          style={{ width: "100%" }}
        >
          {workbooks.map((wb: any) => (
            <Option key={wb.id} value={wb.id}>
              {wb.name}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label="Worksheet">
        <Select
          value={selectedWorksheet}
          onChange={onWorksheetSelect}
          disabled={!selectedWorkbookInfo}
          placeholder="Select worksheet"
          style={{ width: "100%" }}
        >
          {selectedWorkbookInfo?.worksheets.map((ws) => (
            <Option key={ws} value={ws}>
              {ws}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </div>
  );
};

export default WorkbookSelector;
