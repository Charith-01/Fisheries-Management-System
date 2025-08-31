// controllers/notificationController.js
import Notification from "../models/notification.js";
import Customer from "../models/customer.js";
import Fisherman from "../models/fisherman.js";
import jwt from "jsonwebtoken";

export function addNotification(req, res) {
    const { title, message, role, targetEmails } = req.body;

    // Validate required fields
    if (!title || !message || !role) {
        return res.status(400).json({ message: "Title, message, and role are required." });
    }

    // Only allow targetEmails if role is customer
    if (role !== "customer" && targetEmails && targetEmails.length > 0) {
        return res.status(400).json({ message: "Only customers can have targetEmails." });
    }

    const notification = new Notification({
        title,
        message,
        role,
        targetEmails: targetEmails || [],
    });

    notification.save()
        .then((savedNotification) => {
            // Determine which model to query based on role
            let modelToQuery;
            if (role === "customer") modelToQuery = Customer;
            else if (role === "fisherman") modelToQuery = Fisherman;

            let query = {};
            if (role === "customer" && targetEmails && targetEmails.length > 0) {
                query.email = { $in: targetEmails };
            }

            modelToQuery.find(query)
                .then((usersToNotify) => {
                    // Here you can send notifications via email or push
                    res.status(201).json({
                        message: "Notification created successfully",
                        notification: savedNotification,
                        usersToNotify
                    });
                })
                .catch((err) => {
                    res.status(500).json({
                        message: "Notification created but failed to fetch users",
                        error: err.message
                    });
                });
        })
        .catch((err) => {
            res.status(500).json({
                message: "Error creating notification",
                error: err.message
            });
        });
}


export async function getNotifications(req, res) {
  try {
    const { sub: userId, role } = req.user;
    
    if (!role) {
      return res.status(400).json({ message: "User role is required." });
    }

    let query = {};

    if (role === "fisherman") {
      // Fishermen get ALL fisherman notifications
      query = { role: "fisherman" };
    } else if (role === "customer") {
      
      const dbUser = await Customer.findById(userId);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found." });
      }

      const email = dbUser.email.toLowerCase();

      // Customers get:
      //  Broadcast notifications
      //  OR targeted notifications 
      query = {
        role: "customer",
        $or: [
          { targetEmails: { $exists: false } },
          { targetEmails: { $size: 0 } },
          { targetEmails: { $in: [email] } }, //  filter by email
        ],
      };
    }

   
    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    const formatted = notifications.map((n) => {
      const isRead = n.isReadBy.some(
        (readerId) => readerId.toString() === userId.toString()
      );
      return {
        _id: n._id,
        title: n.title,
        message: n.message,
        role: n.role,
        targetEmails: n.targetEmails,
        createdAt: n.createdAt,
        isRead, //  tells frontend if THIS user already read it
      };
    });

    res.json({
      count: formatted.length,
      notifications: formatted,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching notifications", error: err.message });
  }
}


export function markAsRead(req, res) {
    const notificationId = req.params.id;
    const userId = req.body.userId; // frontend must send logged-in user id

    Notification.findById(notificationId)
        .then((notification) => {
            if (!notification) {
                return res.status(404).json({ message: "Notification not found" });
            }

            // Only push if not already marked as read
            if (!notification.isReadBy.includes(userId)) {
                notification.isReadBy.push(userId);
            }

            notification.save()
                .then((updatedNotification) => {
                    res.json({
                        message: "Notification marked as read",
                        notification: updatedNotification
                    });
                })
                .catch((err) => {
                    res.status(500).json({ message: "Error updating notification", error: err.message });
                });
        })
        .catch((err) => {
            res.status(500).json({ message: "Error finding notification", error: err.message });
        });
}



export async function updateNotificationIfUnread(req, res) {
    const notificationId = req.params.id;
    const { title, message } = req.body; // fields admin wants to update

    try {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Check if any user has read it
        if (notification.isReadBy.length > 0) {
            return res.status(400).json({
                message: "Cannot update notification because one or more users have already read it."
            });
        }

        // Update allowed fields
        if (title) notification.title = title;
        if (message) notification.message = message;

        const updatedNotification = await notification.save();

        res.json({
            message: "Notification updated successfully",
            notification: updatedNotification
        });

    } catch (err) {
        res.status(500).json({ message: "Error updating notification", error: err.message });
    }
}




export async function deleteNotification(req, res) {
    const { role, email } = req.user; // from JWT
    const notificationId = req.params.id;

    try {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Admin can delete anything
        if (role === "admin") {
            await notification.deleteOne();
            return res.json({ message: "Notification deleted successfully" });
        }

        // Customer can delete only if their email is in targetEmails
        if (role === "customer") {
            if (!notification.targetEmails || !notification.targetEmails.includes(email)) {
                return res.status(403).json({ message: "You are not allowed to delete this notification" });
            }

            await notification.deleteOne();
            return res.json({ message: "Notification deleted successfully" });
        }

        // Other roles cannot delete
        return res.status(403).json({ message: "You are not allowed to delete this notification" });

    } catch (err) {
        res.status(500).json({ message: "Error deleting notification", error: err.message });
    }
}




export async function getAllNotificationsForAdmin(req, res) {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });

        const formatted = notifications.map((n) => ({
            _id: n._id,
            title: n.title,
            message: n.message,
            role: n.role,
            targetEmails: n.targetEmails,
            createdAt: n.createdAt,
            isReadBy: n.isReadBy.length, // optionally show how many users read it
        }));

        res.json({
            count: formatted.length,
            notifications: formatted,
        });
console.log(req.user)
    } catch (err) {
        res.status(500).json({ message: "Error fetching notifications", error: err.message });
    }
}

