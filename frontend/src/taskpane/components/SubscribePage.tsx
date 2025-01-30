/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
// src/taskpane/components/SubscribePage.tsx

import React, { useState } from "react";
import { Layout, Form, Input, Button, message, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { createCheckoutSession } from "./../utils/api";

const { Content } = Layout;

const SubscribePage: React.FC = () => {
  const [email, setEmail] = useState(localStorage.getItem("userEmail") || "");
  const [isSubscriptionModalVisible, setIsSubscriptionModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const initiateCheckout = async (plan: "monthly" | "yearly") => {
    if (!email) {
      message.error("Email is required for subscription.");
      return;
    }
    setIsLoading(true);
    try {
      const checkoutUrl = await createCheckoutSession(plan, email);
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Error initiating checkout:", error);
      message.error("Failed to initiate checkout.");
    } finally {
      setIsLoading(false);
      setIsSubscriptionModalVisible(false);
    }
  };
  const handleSubscribe = () => {
    setIsSubscriptionModalVisible(true);
  };
  return (
    <Layout style={{ padding: "24px", minHeight: "100vh" }}>
      <Content>
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <Button type="primary" onClick={handleSubscribe} loading={isLoading}>
            Subscribe Now
          </Button>
          <Modal
            title="Choose a Subscription Plan"
            open={isSubscriptionModalVisible}
            onCancel={() => setIsSubscriptionModalVisible(false)}
            footer={null}
          >
            <Form layout="vertical">
              <Form.Item label="Email" required>
                <Input placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Form.Item>
              <Button
                type="primary"
                block
                style={{ marginBottom: "10px" }}
                onClick={() => initiateCheckout("monthly")}
                disabled={isLoading || !email}
              >
                Monthly - $10
              </Button>
              <Button type="primary" block onClick={() => initiateCheckout("yearly")} disabled={isLoading || !email}>
                Yearly - $110
              </Button>
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default SubscribePage;
