/// <reference types="office-js" />

declare namespace Excel {
  interface DataValidationRule {
    wholeNumber?: WholeNumberDataValidation;
    decimal?: BasicDataValidation;
    list?: ListDataValidation;
    date?: DateTimeDataValidation;
    time?: DateTimeDataValidation;
    textLength?: BasicDataValidation;
    custom?: CustomDataValidation;
  }

  interface ListDataValidation {
    inCellDropDown?: boolean;
    source?: string;
  }

  interface DateTimeDataValidation {
    operator?: string; // 'between', 'notBetween', etc.
    formula1?: string;
    formula2?: string;
    allowBlank?: boolean;
  }

  interface BasicDataValidation {
    operator?: string; // 'between', 'notBetween', etc.
    formula1?: string;
    formula2?: string;
    allowBlank?: boolean;
  }

  interface WholeNumberDataValidation {
    operator?: string; // 'between', 'notBetween', etc.
    formula1?: string;
    formula2?: string;
    allowBlank?: boolean;
  }

  interface CustomDataValidation {
    formula1?: string;
    formula2?: string;
    allowBlank?: boolean;
  }
}
