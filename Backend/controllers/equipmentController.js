import Equipment from "../models/equipment.js"

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

    const equipment = new Equipment(req.body)

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
        ()=>{
           res.json({
                message:"Equipment deleted successfully"
            })
        }
    ).catch(
        (err)=>{
            res.status(500).json({
                message:"Equipment not deleted"
            })
        }
    )
}

export function updatEquipment(req,res){
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

    Equipment.findOneAndUpdate({ 
        equipmentID: req.params.equipmentID 
    },req.body).then(
        () => {
            res.json({
                message: "Equipment updated successfully"
            });
        }
    ).catch(
        (err) => {
            res.status(500).json({
                message: "Equipment not updated"
            });
        }
    );
}

export async function getEquipmentById(req, res) {
    const equipmentID = req.params.id;
    const equipment =await Equipment.findOne({ equipmentID: equipmentID });

    if(equipment == null){
        res.status(404).json({
            message : "Equipment not Found"
        })
        return
    }
    res.json({
        equipment: equipment
    })
}