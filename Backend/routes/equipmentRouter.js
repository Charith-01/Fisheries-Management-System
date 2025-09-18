import express from "express"
import { createEquipment, deleteEquipment, getAllEquipments, getEquipmentById, updatEquipment } from "../controllers/equipmentController.js"

const equipmentRouter = express.Router()

equipmentRouter.post("/",createEquipment)
equipmentRouter.get("/", getAllEquipments)
equipmentRouter.delete("/:equipmentID", deleteEquipment)
equipmentRouter.put("/:equipmentID", updatEquipment)
equipmentRouter.get("/:id", getEquipmentById)

export default equipmentRouter