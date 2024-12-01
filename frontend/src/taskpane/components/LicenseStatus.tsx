// src/taskpane/components/LicenseStatus.tsx
import React, { useEffect, useState } from 'react';
import { Card, Button, message } from 'antd';
import axios from 'axios';

const LicenseStatus: React.FC = () => {
  const [licenseInfo, setLicenseInfo] = useState<any>(null);

  useEffect(() => {
    const fetchLicenseStatus = async () => {
      const licenseKey = localStorage.getItem('licenseKey');
      if (licenseKey) {
        try {
          const response = await axios.post('https://yourserver.com/api/get-license-status', { licenseKey });
          setLicenseInfo(response.data);
        } catch (error) {
          console.error('Error fetching license status:', error);
          message.error('Failed to fetch license status.');
        }
      }
    };
    fetchLicenseStatus();
  }, []);

  const handleRenew = () => {
    // Redirect to your renewal page or open a modal
    window.open('https://yourwebsite.com/renew-license', '_blank');
    message.info('Redirecting to renewal page.');
  };

  if (!licenseInfo) {
    return <p>No license information available.</p>;
  }

  return (
    <Card title="License Status" style={{ marginTop: 20 }}>
      <p>License Key: {licenseInfo.licenseKey}</p>
      <p>Plan: {licenseInfo.plan === 'monthly' ? 'Monthly' : 'Annual'}</p>
      <p>Valid Until: {new Date(licenseInfo.expires).toLocaleDateString()}</p>
      <Button type="primary" onClick={handleRenew} style={{ marginTop: 10 }}>
        Renew Subscription
      </Button>
    </Card>
  );
};

export default LicenseStatus;
