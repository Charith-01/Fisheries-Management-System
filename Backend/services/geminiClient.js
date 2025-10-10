// Backend/services/geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = "gemini-2.5-flash";

export function getModel() {
  return genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: `
You are "FMS Customer Assistant" for the Fisheries Management System.
- Guests can browse products, check stock, view office info and payment methods.
- Only logged-in users can see their own orders.
- Never invent prices or stock; use tools to fetch live data.
- Keep answers concise; format as short lists when appropriate.
- If an order request is unauthenticated, say: "Please log in to view your orders."
`.trim()
  });
}

const functionDeclarations = [
  {
    name: "searchProducts",
    description: "Search products with optional price filters.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING" },
        minPrice: { type: "NUMBER" },
        maxPrice: { type: "NUMBER" },
        limit: { type: "NUMBER" },
        page:  { type: "NUMBER" }
      }
    }
  },
  {
    name: "getProductDetails",
    description: "Get one product by productId, including stock.",
    parameters: {
      type: "OBJECT",
      properties: { productId: { type: "STRING" } },
      required: ["productId"]
    }
  },
  {
    name: "checkStock",
    description: "Check total stock (kg) for a species/common name.",
    parameters: {
      type: "OBJECT",
      properties: { species: { type: "STRING" } },
      required: ["species"]
    }
  },
  { name: "getOfficeInfo", description: "Business address/hours/phone/map.", parameters: { type: "OBJECT", properties: {} } },
  { name: "getPaymentOptions", description: "Accepted payment options.", parameters: { type: "OBJECT", properties: {} } },
  {
    name: "getMyOrders",
    description: "Return orders for the authenticated user only.",
    parameters: {
      type: "OBJECT",
      properties: { status: { type: "STRING" }, limit: { type: "NUMBER" }, page: { type: "NUMBER" } }
    }
  },
  {
    name: "getOrderById",
    description: "Return a single order by orderId if owned by the user (or admin).",
    parameters: { type: "OBJECT", properties: { orderId: { type: "STRING" } }, required: ["orderId"] }
  }
];

function safeJSON(s) { try { return JSON.parse(s); } catch { return {}; } }

function extractFunctionCall(resp) {
  // Newer SDKs
  const a = resp?.functionCalls?.[0];
  if (a?.name) return a;
  // Alternative location
  const parts = resp?.candidates?.[0]?.content?.parts || [];
  const b = parts.find(p => p.functionCall)?.functionCall;
  return b || null;
}

async function executeTool(call, toolContext) {
  const name = call?.name;
  const args = typeof call?.args === "string" ? safeJSON(call.args) : (call?.args || {});

  const products = await import("./tools/products.js");
  const meta = await import("./tools/meta.js");
  const orders = await import("./tools/orders.js");

  switch (name) {
    case "searchProducts":    return { name, response: await products.searchProducts(args) };
    case "getProductDetails": return { name, response: await products.getProductDetails(args) };
    case "checkStock":        return { name, response: await products.checkStock(args) };
    case "getOfficeInfo":     return { name, response: meta.getOfficeInfo() };
    case "getPaymentOptions": return { name, response: meta.getPaymentOptions() };
    case "getMyOrders":
      if (!toolContext?.user) throw new Error("Not authenticated");
      return { name, response: await orders.getMyOrders({ ...args, user: toolContext.user }) };
    case "getOrderById":
      if (!toolContext?.user) throw new Error("Not authenticated");
      return { name, response: await orders.getOrderById({ ...args, user: toolContext.user }) };
    default:
      return { name: "unknown", response: { error: `Unknown function ${name}` } };
  }
}

/** messages: [{role:"user"|"model", text:string}], toolContext: { user } */
export async function generateReply(messages, toolContext = {}) {
  const model = getModel();
  const contents = messages.map(m => ({
    role: m.role === "model" ? "model" : "user",
    parts: [{ text: m.text }]
  }));

  try {
    // ✅ Correct tools shape
    const first = await model.generateContent({
      contents,
      tools: { functionDeclarations }
    });

    const call = extractFunctionCall(first?.response);
    if (!call) {
      const txt = first?.response?.text?.() || first?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      return { text: txt || "I couldn’t find that. Try: “Show me available products with price and stock.”" };
    }

    console.log("Gemini requested function:", call.name, "args:", call.args);

    // Run the tool
    let toolResult;
    try {
      toolResult = await executeTool(call, toolContext);
    } catch (toolErr) {
      console.error("Tool error:", toolErr);
      return { text: "I couldn’t complete that request right now. Please try again in a moment." };
    }

    // Feed tool result back
    const follow = await model.generateContent({
      contents: [
        ...contents,
        {
          role: "tool",
          parts: [{
            functionResponse: {
              name: toolResult.name,
              response: toolResult.response
            }
          }]
        }
      ]
    });

    const txt = follow?.response?.text?.() || follow?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    return { text: txt || "Here’s what I found." };
  } catch (err) {
    console.error("Gemini API error:", err);
    // Plain fallback if tools path fails completely
    try {
      const plain = await model.generateContent({ contents });
      const txt = plain?.response?.text?.() || plain?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      return { text: txt || "Sorry, I’m having trouble right now." };
    } catch (e2) {
      console.error("Plain fallback failed:", e2);
      return { text: "Sorry, I’m having trouble connecting right now." };
    }
  }
}
