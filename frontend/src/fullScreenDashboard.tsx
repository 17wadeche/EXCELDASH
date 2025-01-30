/* eslint-disable no-undef */
import React, { useState, useEffect, useRef, useContext } from "react";
import ReactDOM from "react-dom";
import Dashboard from "./taskpane/components/Dashboard";
import { DashboardProvider, DashboardContext } from "./taskpane/context/DashboardContext";
import { DashboardItem, Widget, GridLayoutItem } from "./taskpane/components/types";
import CustomLayout from "./taskpane/components/CustomLayout";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Button } from "antd";
import { isEqual } from "lodash";

const FullScreenDashboardContent: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardItem | null>(null);
  const [setIsPresenterMode] = useState(true);
  const isUpdatingFromParent = useRef(false);
  const [setCurrentWorkbookId] = useState<string | null>(null);
  const {
    setWidgets,
    setLayouts,
    setDashboardBorderSettings,
    setCurrentDashboard,
    widgets,
    layouts,
    setAvailableWorksheets,
  } = useContext(DashboardContext)!;
  const sendMessageToParent = (message: any) => {
    Office.context.ui.messageParent(JSON.stringify(message));
  };
  const closePresenterMode = () => {
    sendMessageToParent({ type: "close" });
  };
  useEffect(() => {
    const messageHandler = (args: any) => {
      const data = JSON.parse(args.message);
      if (data.type === "initialState" || data.type === "updateDashboardData") {
        isUpdatingFromParent.current = true;
        if (!isEqual(data.dashboard.layouts, layouts)) {
          setLayouts(data.dashboard.layouts);
        }
        setDashboardData(data.dashboard);
        setCurrentDashboard(data.dashboard);
        setDashboardBorderSettings(data.dashboard.borderSettings);
        setWidgets(data.dashboard.components);
        setCurrentWorkbookId(data.currentWorkbookId);
        setAvailableWorksheets(data.availableWorksheets);
        isUpdatingFromParent.current = false;
      } else if (data.type === "close") {
        // eslint-disable-next-line no-undef
        Office.context.ui.closeContainer();
      }
    };
    Office.onReady().then(() => {
      Office.context.ui.addHandlerAsync(Office.EventType.DialogParentMessageReceived, messageHandler);
      sendMessageToParent({ type: "requestState" });
    });
    return () => {};
  }, []);

  if (!dashboardData || !widgets || !layouts) {
    return <div>Loading...</div>;
  }
  return (
    <DashboardContent
      isPresenterMode={true}
      setIsPresenterMode={setIsPresenterMode}
      isUpdatingFromParent={isUpdatingFromParent}
      sendMessageToParent={sendMessageToParent}
      closePresenterMode={closePresenterMode}
      dashboardData={dashboardData}
      widgets={widgets}
      layouts={layouts}
      isFullScreen={true}
    />
  );
};
interface DashboardContentProps {
  dashboardData: DashboardItem;
  isPresenterMode: boolean;
  setIsPresenterMode: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdatingFromParent: React.MutableRefObject<boolean>;
  sendMessageToParent: (message: any) => void;
  closePresenterMode: () => void;
  widgets: Widget[];
  layouts: { [key: string]: GridLayoutItem[] };
  isFullScreen?: boolean;
}
const DashboardContent: React.FC<DashboardContentProps> = ({
  dashboardData,
  isPresenterMode,
  setIsPresenterMode,
  isUpdatingFromParent,
  sendMessageToParent,
  closePresenterMode,
  isFullScreen,
}) => {
  const { widgets, layouts, dashboardBorderSettings } = useContext(DashboardContext)!;
  useEffect(() => {
    if (!isUpdatingFromParent.current) {
      const { id, title } = dashboardData;
      const dashboardUpdateData = {
        components: widgets,
        layouts,
        id,
        title,
        borderSettings: dashboardBorderSettings,
      };
      sendMessageToParent({ type: "updateDashboardData", dashboard: dashboardUpdateData });
    }
  }, [widgets, layouts, dashboardBorderSettings]);
  return (
    <CustomLayout>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <>
              {!isFullScreen && ( // Conditionally render the button
                <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
                  <Button onClick={() => setIsPresenterMode(!isPresenterMode)}>
                    {isPresenterMode ? "Enable Editing" : "Enter Presentation Mode"}
                  </Button>
                </div>
              )}
              <Dashboard
                isPresenterMode={isPresenterMode}
                closePresenterMode={closePresenterMode}
                isFullScreen={isFullScreen} // Pass the prop
              />
            </>
          }
        />
      </Routes>
    </CustomLayout>
  );
};
const FullScreenDashboard: React.FC = () => (
  <div style={{ width: "100%", height: "100%" }}>
    <MemoryRouter initialEntries={["/dashboard"]}>
      <DashboardProvider>
        <div style={{ width: "100%", height: "100%" }}>
          <FullScreenDashboardContent />
        </div>
      </DashboardProvider>
    </MemoryRouter>
  </div>
);
Office.onReady(() => {
  ReactDOM.render(<FullScreenDashboard />, document.getElementById("root"));
});
