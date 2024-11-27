// src/utils/licenseUtils.ts
import { v4 as uuidv4 } from 'uuid';

export const getOrCreateLicenseKey = async (): Promise<string> => {
  if (
    typeof Office === 'undefined' ||
    !Office.context ||
    !Office.context.document ||
    !Office.context.document.settings
  ) {
    // Office is not available, use localStorage for development/testing
    let licenseKey = localStorage.getItem('excel_addin_license_key');
    if (!licenseKey) {
      licenseKey = uuidv4();
      localStorage.setItem('excel_addin_license_key', licenseKey);
    }
    return licenseKey;
  }

  // Wait for Office to be ready
  await Office.onReady();

  let licenseKey = Office.context.document.settings.get('licenseKey');
  if (!licenseKey) {
    licenseKey = uuidv4();
    Office.context.document.settings.set('licenseKey', licenseKey);

    // Save settings asynchronously
    await new Promise<void>((resolve, reject) => {
      Office.context.document.settings.saveAsync((result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve();
        } else {
          reject(result.error);
        }
      });
    });
  }
  return licenseKey;
};
