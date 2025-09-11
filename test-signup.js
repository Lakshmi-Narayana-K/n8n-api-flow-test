/**
 * Test script for the signup endpoint and invitation acceptance
 * Testing the production n8n API directly
 */

const axios = require("axios");

// Production server base URL
const BASE_URL = "https://workflow.alpha.earlywave.in";

// Function to extract parameters from invitation URL
function extractInvitationParams(inviteUrl) {
  try {
    const url = new URL(inviteUrl);
    const params = new URLSearchParams(url.search);

    const inviterId = params.get("inviterId");
    const inviteeId = params.get("inviteeId");

    return { inviterId, inviteeId };
  } catch (error) {
    console.error("❌ Error parsing invitation URL:", error.message);
    return null;
  }
}

// Function to accept invitation
async function acceptInvitation(params) {
  try {
    console.log("🎯 Accepting invitation for inviteeId:", params.inviteeId);

    const response = await axios.post(
      `${BASE_URL}/rest/invitations/${params.inviteeId}/accept`,
      {
        firstName: "Test",
        lastName: "Test",
        password: "Test@123",
        inviterId: params.inviterId,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Invitation acceptance successful!");
    console.log("📨 Response:", JSON.stringify(response.data, null, 2));
    console.log(
      "📋 Response Headers:",
      JSON.stringify(response.headers, null, 2)
    );

    return response.data;
  } catch (error) {
    console.error("❌ Invitation acceptance failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
    throw error;
  }
}

async function testSignupAndAcceptInvitation() {
  try {
    console.log("🧪 Testing n8n production API directly...");

    // Step 1: Create user and get invitation
    const signupResponse = await axios.post(
      `${BASE_URL}/api/v1/users`,
      [
        {
          email: "test2@ex.com",
          role: "global:member",
        },
      ],
      {
        headers: {
          "Content-Type": "application/json",
          "X-N8N-API-KEY":
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOThkYTczNy04YTMyLTQ0YjQtOGI4Yi1hYTg2YmI0YjVhYjkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU3NTg1NzE4LCJleHAiOjE3NjAxMjEwMDB9.1qjqWaC_qn4GK5CiJjBKtWfOYSvmlbhc3uAeAykKyM8",
        },
      }
    );

    console.log("✅ Signup test successful!");
    console.log(
      "📨 Signup Response:",
      JSON.stringify(signupResponse.data, null, 2)
    );

    if (signupResponse.data[0]?.user?.inviteAcceptUrl) {
      const inviteUrl = signupResponse.data[0].user.inviteAcceptUrl;
      console.log("🔗 Invitation URL:", inviteUrl);

      // Step 2: Extract parameters from invitation URL
      const params = extractInvitationParams(inviteUrl);
      if (params && params.inviteeId) {
        console.log("📋 Extracted parameters:");
        console.log("   - InviterID:", params.inviterId);
        console.log("   - InviteeID:", params.inviteeId);

        // Step 3: Accept the invitation
        await acceptInvitation(params);
      } else {
        console.error("❌ Could not extract invitation parameters from URL");
      }
    } else {
      console.warn("⚠️ No invitation URL found in response");
    }
  } catch (error) {
    console.error("❌ Test failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

// Run the test
testSignupAndAcceptInvitation();
