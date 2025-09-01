// routes/notificationRoutes.js
import express from "express";
import { addNotification, getNotifications, markAsRead, updateNotificationIfUnread, deleteNotification, getAllNotificationsForAdmin } from "../controllers/notificationController.js";
import verifyJWT from "../middleware/auth.js";


const Nrouter = express.Router();

// POST /api/notifications - create a notification (admin only)
Nrouter.post("/", addNotification);

// Current logged-in role fetches notifications
Nrouter.get("/", verifyJWT, getNotifications);

// Mark a notification as read
Nrouter.patch("/:id/read", verifyJWT, markAsRead)

// Update a notification (only if no user has read it)
Nrouter.put("/:id", updateNotificationIfUnread);

Nrouter.delete("/:id", deleteNotification);

Nrouter.get("/admin", getAllNotificationsForAdmin);

export default Nrouter;
