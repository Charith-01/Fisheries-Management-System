import Equipment from "../models/equipment.js"
import Boat from "../models/boat.js"

export function createEquipment(req,res){
    if(req.user == null){
        res.status(403).json({
            message : "You need to login first"
        })
        return
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message : "You are not authorized to add a equipment"
        })
        return
    }

    const equipmentData = {
        ...req.body,
        availableQuantity: req.body.totalQuantity // Set available quantity equal to total quantity initially
    };

    const equipment = new Equipment(equipmentData)

    equipment.save().then(
        ()=>{
            res.json({
                message : "Equipment saved successfully"
            })
        }
    ).catch(
        (err)=>{
            console.log(err)
            res.status(500).json({
                message : "Equipment not saved"
            })
        }
    )
}

export function getAllEquipments(req,res){
    Equipment.find().then(
        (equipments)=>{
            res.json(equipments)
        }
    ).catch(
        (err)=>{
            console.error("Error fetching equipment:", err);
            res.status(500).json({
                message : "Equipments not found"
            })
        }
    )
}

export function deleteEquipment(req,res){
    if(req.user == null){
        res.status(403).json({
            message:"You need to  login first"
        })
        return
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message:"You are not authorized to delete a equipment"
        })
        return
    }

    Equipment.findOneAndDelete({
        equipmentID: req.params.equipmentID
    }).then(
        async (deletedEquipment)=>{
            if (deletedEquipment) {
                // Remove this equipment from all boats and return quantities
                const boats = await Boat.find({ "equipmentAssignments.equipment": deletedEquipment._id });
                
                for (const boat of boats) {
                    const assignment = boat.equipmentAssignments.find(
                        a => a.equipment.toString() === deletedEquipment._id.toString()
                    );
                    if (assignment) {
                        // Remove the assignment
                        boat.equipmentAssignments = boat.equipmentAssignments.filter(
                            a => a.equipment.toString() !== deletedEquipment._id.toString()
                        );
                        await boat.save();
                    }
                }
            }
            res.json({
                message:"Equipment deleted successfully"
            })
        }
    ).catch(
        (err)=>{
            console.error("Error deleting equipment:", err);
            res.status(500).json({
                message:"Equipment not deleted"
            })
        }
    )
}

export async function updatEquipment(req,res){
    if(req.user == null){
        res.status(403).json({
            message:"You need login first"
        })
        return;
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message: "You are not authorized to update a equipment"
        })
        return;
    }

    try {
        const { equipmentID } = req.params;
        const updateData = { ...req.body };

        // If totalQuantity is updated, adjust availableQuantity accordingly
        if (updateData.totalQuantity !== undefined) {
            const currentEquipment = await Equipment.findOne({ equipmentID });
            if (currentEquipment) {
                const quantityDifference = updateData.totalQuantity - currentEquipment.totalQuantity;
                updateData.availableQuantity = currentEquipment.availableQuantity + quantityDifference;
                
                // Ensure availableQuantity doesn't go below 0
                if (updateData.availableQuantity < 0) {
                    updateData.availableQuantity = 0;
                }
            }
        }

        // Update the equipment
        const updatedEquipment = await Equipment.findOneAndUpdate(
            { equipmentID: equipmentID },
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            message: "Equipment updated successfully",
            equipment: updatedEquipment
        });
    } catch (err) {
        console.error("Error updating equipment:", err);
        res.status(500).json({
            message: "Equipment not updated"
        });
    }
}

export async function getEquipmentById(req, res) {
    const equipmentID = req.params.id;
    try {
        const equipment = await Equipment.findOne({ equipmentID: equipmentID });
        
        if(!equipment){
            res.status(404).json({
                message : "Equipment not Found"
            })
            return
        }
        res.json({
            equipment: equipment
        })
    } catch (error) {
        console.error("Error fetching equipment:", error);
        res.status(500).json({
            message: "Error fetching equipment"
        })
    }
}

// New function to assign equipment to boat
export async function assignEquipmentToBoat(req, res) {
    if(req.user == null || req.user.role != "admin"){
        return res.status(403).json({ message: "Not authorized" });
    }

    try {
        const { boatNumber, equipmentID, quantity } = req.body;

        const equipment = await Equipment.findOne({ equipmentID });
        const boat = await Boat.findOne({ boatNumber });

        if (!equipment || !boat) {
            return res.status(404).json({ message: "Equipment or Boat not found" });
        }

        if (equipment.availableQuantity < quantity) {
            return res.status(400).json({ 
                message: `Not enough equipment available. Only ${equipment.availableQuantity} available.` 
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than 0" });
        }

        // Check if equipment is already assigned to this boat
        const existingAssignmentIndex = boat.equipmentAssignments.findIndex(
            assignment => assignment.equipment.toString() === equipment._id.toString()
        );

        if (existingAssignmentIndex !== -1) {
            // Update existing assignment
            boat.equipmentAssignments[existingAssignmentIndex].quantity += parseInt(quantity);
        } else {
            // Add new assignment
            boat.equipmentAssignments.push({
                equipment: equipment._id,
                quantity: parseInt(quantity)
            });
        }

        // Update available quantity
        equipment.availableQuantity -= parseInt(quantity);

        await boat.save();
        await equipment.save();

        // Populate the response for better frontend display
        const updatedBoat = await Boat.findOne({ boatNumber }).populate('equipmentAssignments.equipment', 'equipmentID name type');
        const updatedEquipment = await Equipment.findOne({ equipmentID });

        res.json({
            message: "Equipment assigned to boat successfully",
            boat: updatedBoat,
            equipment: updatedEquipment
        });
    } catch (err) {
        console.error("Error assigning equipment:", err);
        res.status(500).json({
            message: "Error assigning equipment to boat"
        });
    }
}

// New function to remove equipment from boat
export async function removeEquipmentFromBoat(req, res) {
    if(req.user == null || req.user.role != "admin"){
        return res.status(403).json({ message: "Not authorized" });
    }

    try {
        const { boatNumber, equipmentID, quantity } = req.body;

        const equipment = await Equipment.findOne({ equipmentID });
        const boat = await Boat.findOne({ boatNumber });

        if (!equipment || !boat) {
            return res.status(404).json({ message: "Equipment or Boat not found" });
        }

        const assignmentIndex = boat.equipmentAssignments.findIndex(
            assignment => assignment.equipment.toString() === equipment._id.toString()
        );

        if (assignmentIndex === -1) {
            return res.status(404).json({ message: "Equipment not assigned to this boat" });
        }

        const assignment = boat.equipmentAssignments[assignmentIndex];

        if (assignment.quantity < quantity) {
            return res.status(400).json({ 
                message: `Cannot remove more than assigned quantity. Currently assigned: ${assignment.quantity}` 
            });
        }

        if (assignment.quantity === quantity) {
            // Remove entire assignment
            boat.equipmentAssignments.splice(assignmentIndex, 1);
        } else {
            // Reduce quantity
            assignment.quantity -= parseInt(quantity);
        }

        // Return equipment to available pool
        equipment.availableQuantity += parseInt(quantity);

        await boat.save();
        await equipment.save();

        // Populate the response for better frontend display
        const updatedBoat = await Boat.findOne({ boatNumber }).populate('equipmentAssignments.equipment', 'equipmentID name type');
        const updatedEquipment = await Equipment.findOne({ equipmentID });

        res.json({
            message: "Equipment removed from boat successfully",
            boat: updatedBoat,
            equipment: updatedEquipment
        });
    } catch (err) {
        console.error("Error removing equipment:", err);
        res.status(500).json({
            message: "Error removing equipment from boat"
        });
    }
}

// New function to get boat equipment assignments
export async function getBoatEquipment(req, res) {
    try {
        const { boatNumber } = req.params;
        
        const boat = await Boat.findOne({ boatNumber })
            .populate('equipmentAssignments.equipment', 'equipmentID name type availableQuantity totalQuantity');

        if (!boat) {
            return res.status(404).json({ message: "Boat not found" });
        }

        res.json({
            boat: boat
        });
    } catch (err) {
        console.error("Error fetching boat equipment:", err);
        res.status(500).json({
            message: "Error fetching boat equipment"
        });
    }
}