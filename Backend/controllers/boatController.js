import Boat from "../models/boat.js";

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
        ()=>{
            res.json({message: "Boat saved successfully"})
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
    Boat.find().then(
        (boats)=>{
            res.json(boats)
        }
    ).catch(
        (err)=>{
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
        ()=>{
            res.json({
                message:"Boat deleted successfully"
            })
        }
    ).catch(
        (err)=>{
            res.status(500).json({
                message:"Boat not deleted"
            })
        }
    )
}


export function updateBoat(req,res){
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

    Boat.findOneAndUpdate({ 
        boatNumber: req.params.boatNumber 
    },req.body).then(
        () => {
            res.json({
                message: "Boat updated successfully"
            });
        }
    ).catch(
        (err) => {
            res.status(500).json({
                message: "Boat not updated"
            });
        }
    );
}


export async function getBoatById(req, res) {
    const boatNumber = req.params.id;
    const boat =await Boat.findOne({ boatNumber: boatNumber });

    if(boat == null){
        res.status(404).json({
            message : "Boat not Found"
        })
        return
    }
    res.json({
        boat: boat
    })
}