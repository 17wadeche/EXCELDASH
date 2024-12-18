// src/utils/excelUtils.ts

/// <reference types="office-js" />

import { v4 as uuidv4 } from 'uuid';

/**
 * Determines if the current context is running within a dialog.
 * Useful for deciding whether to execute certain operations.
 * 
 * @returns {boolean} True if running in a dialog; otherwise, false.
 */
export const isInDialog = (): boolean => {
  return !!Office?.context?.ui?.messageParent;
};

/**
 * Sets the workbook ID in the workbook's custom properties.
 * If the code is running within a dialog, the operation is skipped.
 * 
 * @param {string} workbookId - The unique identifier to set for the workbook.
 */
export const setWorkbookIdInProperties = async (workbookId: string): Promise<void> => {
  if (isInDialog()) {
    console.log('Running in dialog; skipping setWorkbookIdInProperties.');
    return;
  }
  try {
    await Excel.run(async (context) => {
      const customProps = context.workbook.properties.custom;
      const existingProp = customProps.getItemOrNullObject("dashboardWorkbookId");
      await context.sync();
      if (!existingProp.isNullObject) {
        existingProp.delete();
        await context.sync();
      }
      customProps.add("dashboardWorkbookId", workbookId);
      await context.sync();
      console.log(`Workbook ID "${workbookId}" set successfully in custom properties.`);
    });
  } catch (error) {
    console.error('Error setting workbook ID in custom properties:', error);
  }
};

/**
 * Retrieves the workbook ID from the workbook's custom properties.
 * If the ID does not exist, a new UUID is generated, set, and returned.
 * If running within a dialog or an Excel host is not detected, a UUID is generated and set.
 * 
 * @returns {Promise<string>} The workbook ID.
 */
export const getWorkbookIdFromProperties = async (): Promise<string> => {
  if (isInDialog()) {
    console.log('Running in dialog; skipping getWorkbookIdFromProperties.');
    return '';
  }
  if (!(Office && Office.context && Office.context.host === Office.HostType.Excel)) {
    const workbookId = uuidv4();
    await setWorkbookIdInProperties(workbookId);
    return workbookId;
  }
  try {
    return await Excel.run(async (context: Excel.RequestContext) => {
      const customProps = context.workbook.properties.custom;
      const prop = customProps.getItemOrNullObject("dashboardWorkbookId");
      await context.sync();
      if (prop.isNullObject) {
        const workbookId = uuidv4();
        customProps.add("dashboardWorkbookId", workbookId);
        await context.sync();
        console.log(`Workbook ID "${workbookId}" generated and set.`);
        return workbookId;
      }
      prop.load("value");
      await context.sync();
      if (prop.value) {
        console.log(`Workbook ID "${prop.value}" retrieved from custom properties.`);
        return prop.value;
      } else {
        const workbookId = uuidv4();
        customProps.add("dashboardWorkbookId", workbookId);
        await context.sync();
        console.log(`Workbook ID "${workbookId}" generated and set.`);
        return workbookId;
      }
    });
  } catch (error) {
    console.error('Error getting workbook ID from custom properties:', error);
    const workbookId = uuidv4();
    await setWorkbookIdInProperties(workbookId);
    return workbookId;
  }
};
