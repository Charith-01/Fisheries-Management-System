import express from "express"
import { assignEquipmentToBoat, createEquipment, deleteEquipment, getAllEquipments, getBoatEquipment, getEquipmentById, removeEquipmentFromBoat, updatEquipment } from "../controllers/equipmentController.js"

const equipmentRouter = express.Router()

equipmentRouter.post("/",createEquipment)
equipmentRouter.get("/", getAllEquipments)
equipmentRouter.delete("/:equipmentID", deleteEquipment)
equipmentRouter.put("/:equipmentID", updatEquipment)
equipmentRouter.get("/:id", getEquipmentById)
equipmentRouter.post("/assign", assignEquipmentToBoat)
equipmentRouter.post("/remove", removeEquipmentFromBoat)

equipmentRouter.get("/boat/:boatNumber", getBoatEquipment)



export default equipmentRouter