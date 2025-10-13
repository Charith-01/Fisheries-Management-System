import Boat from "../models/boat.js";
import Equipment from "../models/equipment.js";

export function createBoat(req,res){
    if(req.user == null){
        res.status(403).json({
            message: "You need to login first"
        })
        return
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message: "You are not authorized to add a boat"
        })
        return
    }

    const boat = new Boat(req.body)

    boat.save().then(
        (savedBoat)=>{
            res.json({
                message: "Boat saved successfully",
                boat: savedBoat
            })
        }
    ).catch(
        (err)=>{
            console.log(err)
            res.status(500).json({
                message:"Boat not saved"
            })
        }
    )
}

export function getAllBoats(req,res){
    Boat.find().populate('equipmentAssignments.equipment', 'equipmentID name type').then(
        (boats)=>{
            res.json(boats)
        }
    ).catch(
        (err)=>{
            console.error("Error fetching boats:", err);
            res.status(500).json({
                message: "Boats not found"
            })
        }
    )
}

export function deleteBoat(req,res){
    if(req.user == null){
        res.status(403).json({
            message:"You need to  login first"
        })
        return
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message:"You are not authorized to delete a boat"
        })
        return
    }

    Boat.findOneAndDelete({
        boatNumber: req.params.boatNumber
    }).then(
        async (deletedBoat)=>{
            if (deletedBoat && deletedBoat.equipmentAssignments.length > 0) {
                // Return all assigned equipment to available pool
                for (const assignment of deletedBoat.equipmentAssignments) {
                    await Equipment.findByIdAndUpdate(
                        assignment.equipment,
                        { $inc: { availableQuantity: assignment.quantity } }
                    );
                }
            }
            res.json({
                message:"Boat deleted successfully"
            })
        }
    ).catch(
        (err)=>{
            console.error("Error deleting boat:", err);
            res.status(500).json({
                message:"Boat not deleted"
            })
        }
    )
}

export async function updateBoat(req,res){
    if(req.user == null){
        res.status(403).json({
            message:"You need login first"
        })
        return;
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message: "You are not authorized to update a boat"
        })
        return;
    }

    try {
        const { boatNumber } = req.params;
        const updateData = { ...req.body };

        // Update the boat
        const updatedBoat = await Boat.findOneAndUpdate(
            { boatNumber: boatNumber },
            updateData,
            { new: true, runValidators: true }
        ).populate('equipmentAssignments.equipment', 'equipmentID name type');

        res.json({
            message: "Boat updated successfully",
            boat: updatedBoat
        });
    } catch (err) {
        console.error("Error updating boat:", err);
        res.status(500).json({
            message: "Boat not updated"
        });
    }
}

export async function getBoatById(req, res) {
    const boatNumber = req.params.id;
    try {
        const boat = await Boat.findOne({ boatNumber: boatNumber })
            .populate('equipmentAssignments.equipment', 'equipmentID name type availableQuantity totalQuantity');

        if(!boat){
            res.status(404).json({
                message : "Boat not Found"
            })
            return
        }
        res.json({
            boat: boat
        })
    } catch (error) {
        console.error("Error fetching boat:", error);
        res.status(500).json({
            message: "Error fetching boat"
        })
    }
}