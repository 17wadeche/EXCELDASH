// src/utils/excelUtils.ts

/// <reference types="office-js" />

export const getWorkbookIdFromProperties = async (): Promise<string | null> => {
  try {
    return await Excel.run(async (context) => {
      const customProps = context.workbook.properties.custom;
      const prop = customProps.getItemOrNullObject("dashboardWorkbookId");
      await context.sync();
      if (prop.isNullObject) {
        return null;
      }
      prop.load("value");
      await context.sync();
      return prop.value;
    });
  } catch (error) {
    console.error('Error getting workbook ID from custom properties:', error);
    return null;
  }
};

export const setWorkbookIdInProperties = async (workbookId: string): Promise<void> => {
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
    });
  } catch (error) {
    console.error('Error setting workbook ID in custom properties:', error);
  }
};
