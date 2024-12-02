// src/taskpane/components/widgets/ResizableTitle.tsx

import React from 'react';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

const ResizableTitle = (props: any) => {
  const { onResize, width, onClick, className, style, children, ...restProps } = props;

  if (!width) {
    return <th {...restProps}>{children}</th>;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={e => {
            e.stopPropagation();
          }}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} style={{ ...style, width }}>
        {children}
      </th>
    </Resizable>
  );
};

export default ResizableTitle;
