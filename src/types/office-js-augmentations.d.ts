/// <reference types="office-js" />

declare namespace Excel {
  interface Range {
    columnWidth: number;
    // Add other missing properties if needed
  }
}

declare namespace Excel {
  interface DataValidation {
    allowBlank: boolean;
    // Add other missing properties if needed
  }
}