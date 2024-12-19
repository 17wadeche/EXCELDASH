import * as ExcelJS from "office-js";

declare global {
  const Excel: typeof ExcelJS.Excel;
}
export {};
