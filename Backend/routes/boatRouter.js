import express from "express"
import { createBoat, deleteBoat, getAllBoats, getBoatById, updateBoat } from "../controllers/boatController.js"

const boatRouter = express.Router()

boatRouter.post("/",createBoat)
boatRouter.get("/",getAllBoats)
boatRouter.delete("/:boatNumber",deleteBoat)
boatRouter.put("/:boatNumber",updateBoat)
boatRouter.get("/:id",getBoatById)

export default boatRouter