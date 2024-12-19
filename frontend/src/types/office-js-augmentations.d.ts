/// <reference types="office-js" />

declare namespace Excel {
  interface Range {
    columnWidth: number;
  }
}

declare namespace Excel {
  interface DataValidation {
    allowBlank: boolean;
  }
}