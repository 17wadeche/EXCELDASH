// src/utils/excelUtils.ts
/// <reference types="office-js" />
import { v4 as uuidv4 } from 'uuid';

export const isInDialog = (): boolean => {
  return !!Office?.context?.ui?.messageParent;
};

export const setWorkbookIdInProperties = async (workbookId: string): Promise<void> => {
  const lowerCaseId = workbookId.toLowerCase();
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
      customProps.add("dashboardWorkbookId", lowerCaseId);
      await context.sync();
      console.log(`Workbook ID "${lowerCaseId}" set successfully in custom properties.`);
    });
  } catch (error) {
    console.error('Error setting workbook ID in custom properties:', error);
  }
};

export const getWorkbookIdFromProperties = async (): Promise<string> => {
  if (isInDialog()) {
    console.log('Running in dialog; skipping getWorkbookIdFromProperties.');
    return '';
  }
  try {
    return await Excel.run(async (context: Excel.RequestContext) => {
      const customProps = context.workbook.properties.custom;
      const prop = customProps.getItemOrNullObject("dashboardWorkbookId");
      await context.sync();
      if (prop.isNullObject) {
        const workbookId = uuidv4().toLowerCase();
        customProps.add("dashboardWorkbookId", workbookId);
        await context.sync();
        console.log(`Workbook ID "${workbookId}" generated and set.`);
        return workbookId;
      }
      prop.load("value");
      await context.sync();
      if (prop.value) {
        const lowerCaseId = prop.value.toLowerCase();
        console.log(`Workbook ID "${lowerCaseId}" retrieved from custom properties.`);
        return lowerCaseId;
      } else {
        const workbookId = uuidv4().toLowerCase();
        customProps.add("dashboardWorkbookId", workbookId);
        await context.sync();
        console.log(`Workbook ID "${workbookId}" generated and set.`);
        return workbookId;
      }
    });
  } catch (error) {
    if (error instanceof OfficeExtension.Error && error.code === "InvalidOperationInCellEditMode") {
      console.error("Please exit cell editing mode (press Enter or Tab) and try again.");
      throw error;
    } else {
      console.error('Error getting workbook ID from custom properties:', error);
      const workbookId = uuidv4().toLowerCase();
      await setWorkbookIdInProperties(workbookId);
      return workbookId;
    }
  }
};