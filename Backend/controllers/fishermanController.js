import Fisherman from "../models/fisherman.js";
import bcrypt from "bcrypt";
import loginController from "./loginController.js";

export function registerFisherman(req, res){
    if(req.user == null){
        res.status(403).json({
            message: "Please log in as an admin"
        });
        return;
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message: "Unauthorized"
        });
        return;
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const fisherman = new Fisherman({
        email: req.body.email,
        password: hashedPassword,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        address: req.body.address,
        phone: req.body.phone,
        licenseNumber: req.body.licenseNumber,
        boatNumber: req.body.boatNumber,
        position: req.body.position,
        isEmailVerified: req.body.isEmailVerified,
        createdAt: req.body.createdAt,
        isDisabled: req.body.isDisabled
    });

    fisherman.save().then((result) => {
        res.json({
            message: "Fisherman registered successfully",
            fisherman: result
        })
    }).catch((err) =>{
        res.status(500).json({
            message: "Error registering fisherman",
            error: err.message
        });
    })
}

export function loginFisherman(req, res){
    req.body.role = "fisherman";
    return loginController(req, res);
}