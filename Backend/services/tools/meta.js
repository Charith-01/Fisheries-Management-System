import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// exact path to your JSON file
const infoPath = path.resolve(__dirname, "../../config/businessInfo.json");

function readBusinessInfo() {
  try {
    if (fs.existsSync(infoPath)) {
      const raw = fs.readFileSync(infoPath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading businessInfo.json:", err);
  }
  // fallback
  return {
    name: "Fisheries Management System",
    address: "Not available",
    hours: "Mon–Sat",
    phone: "",
    email: "",
    mapUrl: "",
    paymentOptions: ["Visa", "Mastercard", "Cash on Delivery"]
  };
}

export function getOfficeInfo() {
  const i = readBusinessInfo();
  return {
    name: i.name || "Fisheries Management System",
    address: i.address || "Not available",
    hours: i.hours || "Mon–Sat",
    phone: i.phone || "",
    email: i.email || "",
    mapUrl: i.mapUrl || ""
  };
}

export function getPaymentOptions() {
  const i = readBusinessInfo();
  return {
    options: Array.isArray(i.paymentOptions)
      ? i.paymentOptions
      : ["Visa", "Mastercard", "Cash on Delivery"]
  };
}
