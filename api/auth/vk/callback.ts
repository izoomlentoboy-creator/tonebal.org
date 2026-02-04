import type { VercelRequest, VercelResponse } from '@vercel/node';

const VK_APP_ID = "54441764";
const VK_APP_SECRET = process.env.VK_APP_SECRET || "";
const BASE_URL = process.env.BASE_URL || "https://tonebal.org";
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

// Simple JWT creation (for session token)
async function createSessionToken(userId: string, name: string): Promise<string> {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
  })).toString("base64url");

  const crypto = await import("crypto");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code, device_id } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code is required" });
    }

    // Exchange code for access token via VK ID API
    const tokenResponse = await fetch("https://id.vk.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: VK_APP_ID,
        client_secret: VK_APP_SECRET,
        device_id: device_id || "",
        redirect_uri: `${BASE_URL}/api/auth/vk/callback`,
        state: "",
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token || !tokenData.user_id) {
      console.error("[VK ID] Token exchange failed:", tokenData);
      return res.status(400).json({ error: "Token exchange failed", details: tokenData });
    }

    // Get user info from VK API
    const userUrl = new URL("https://api.vk.com/method/users.get");
    userUrl.searchParams.set("user_ids", tokenData.user_id.toString());
    userUrl.searchParams.set("fields", "photo_200");
    userUrl.searchParams.set("access_token", tokenData.access_token);
    userUrl.searchParams.set("v", "5.131");

    const userResponse = await fetch(userUrl.toString());
    const userData = await userResponse.json();

    if (!userData.response || !userData.response[0]) {
      return res.status(400).json({ error: "Failed to get user data" });
    }

    const vkUser = userData.response[0];
    const vkUserId = `vk_${vkUser.id}`;
    const userName = `${vkUser.first_name} ${vkUser.last_name}`.trim();

    // Create session token
    const sessionToken = await createSessionToken(vkUserId, userName);

    // Set cookie
    const cookieOptions = [
      `session=${sessionToken}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Secure",
      `Max-Age=${365 * 24 * 60 * 60}`, // 1 year
    ].join("; ");

    res.setHeader("Set-Cookie", cookieOptions);

    return res.status(200).json({
      success: true,
      userId: vkUserId,
      name: userName
    });
  } catch (error) {
    console.error("[VK ID Auth] Callback failed", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
