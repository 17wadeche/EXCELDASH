/* eslint-disable no-undef */
// src/excel-custom.d.ts

import "office-js";

declare global {
  namespace Excel {
    interface Chart {
      getDataBodyRange(): Range;
    }
  }
}
