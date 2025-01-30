import React from "react";
import { TitleWidgetData } from "./types";

interface TitleWidgetProps {
  data: TitleWidgetData;
}

const TitleWidgetComponent: React.FC<TitleWidgetProps> = ({ data }) => {
  const { content, fontSize, textColor, backgroundColor, titleAlignment } = data;

  const style: React.CSSProperties = {
    fontSize,
    color: textColor,
    backgroundColor,
    textAlign: titleAlignment,
    margin: 0,
    padding: "10px",
  };

  return <h1 style={style}>{content}</h1>;
};

export default TitleWidgetComponent;
