import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Spin, Button } from "antd";

const ScreenshotDialog = () => {
  const [imageData, setImageData] = useState<string | null>(null);
  useEffect(() => {
    Office.onReady()
      .then(() => {
        Office.context.ui.messageParent(JSON.stringify({ type: "requestImage" }));
        const messageHandler = (arg: any) => {
          try {
            const message = JSON.parse(arg.message);
            if (message.type === "imageData") {
              setImageData(message.data);
            } else if (message.type === "close") {
              window.close();
            }
          } catch (error) {
            console.error("Error parsing message from parent:", error);
          }
        };
        Office.context.ui.addHandlerAsync(Office.EventType.DialogParentMessageReceived, messageHandler);
      })
      .catch((error) => {
        console.error("Office.js is not ready:", error);
      });
  }, []);
  const handleClose = () => {
    Office.context.ui.messageParent(JSON.stringify({ type: "close" }));
    window.close();
  };
  if (!imageData) {
    return (
      <div className="screenshot-container">
        <Button className="close-button" onClick={handleClose} aria-label="Close Screenshot Dialog">
          Close
        </Button>
        <Spin tip="Loading Full Screen..." />
      </div>
    );
  }
  return (
    <div className="screenshot-container">
      <Button className="close-button" onClick={handleClose} aria-label="Close Screenshot Dialog">
        Close
      </Button>
      <img src={imageData} alt="Dashboard Screenshot" className="screenshot-image" />
    </div>
  );
};
Office.onReady()
  .then(() => {
    ReactDOM.render(<ScreenshotDialog />, document.getElementById("root"));
  })
  .catch((error) => {
    console.error("Office.js is not ready:", error);
  });
