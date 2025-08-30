import Admin from "../models/admin.js";
import bcrypt from "bcrypt";
import loginController from "./loginController.js";

export function registerAdmin(req, res){
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    console.log(hashedPassword);

    const admin = new Admin({
        email: req.body.email,
        password: hashedPassword
    })

    admin.save().then((result) => {
        res.json({
            message : "Admin registered successfully",
            admin: result
        });
    }).catch((err) => {
        res.status(500).json({
            message: "Error registering admin",
            error: err.message
        });
    });
}

export function loginAdmin(req, res){
    req.body.role = "admin";
    return loginController(req, res);
}