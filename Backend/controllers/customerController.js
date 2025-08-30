import Customer from "../models/customer.js";
import bcrypt from "bcrypt";
import loginController from "./loginController.js";

export function registerCustomer(req, res){

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    console.log(hashedPassword);

    const customer = new Customer({
        email : req.body.email,
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        password : hashedPassword,
        address : req.body.address,
        phone : req.body.phone
    })

    customer.save().then((result) => {
        res.json({
            message: "Customer registered successfully",
            customer: result
        });
    }).catch((err) => {
        console.error(err);
        res.status(500).json({
            message: "Error registering customer"
        });
    });
}

export function loginCustomer(req, res){

    req.body.role = "customer";
    return loginController(req, res);

    // const email = req.body.email;
    // const password = req.body.password;

    // Customer.findOne({
    //     email : email
    // }).then((customer) => {
    //     if(customer == null){
    //         res.status(404).json({
    //             message: "Invalid email"
    //         })
    //     }
    //     else{
    //         const isPasswordValid = bcrypt.compareSync(password, customer.password);

    //         if(isPasswordValid){
                
    //             const customerData = {
    //                 email: customer.email,
    //                 firstName: customer.firstName,
    //                 lastName: customer.lastName,
    //                 role: customer.role,
    //                 address: customer.address,
    //                 phone: customer.phone,
    //                 createdAt: customer.createdAt,
    //                 isDisabled: customer.isDisabled,
    //                 isEmailVerified: customer.isEmailVerified,
    //                 lastLogin: customer.lastLogin
    //             }

    //             const token = jwt.sign(customerData, "1234fish");
    //             res.json({
    //                 message: "Login successful",
    //                 token: token,
    //                 customer: customerData
    //             });
    //         }
    //         else{
    //             res.status(401).json({
    //                 message: "Invalid password"
    //             })
    //         }
    //     }
    // })
}