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

//HH
export async function listFishermen(req, res) {
  try {
    const { position, q } = req.query; // position: 'skipper' | 'crew'
    const filter = {};
    if (position) filter.position = position;
    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName:  { $regex: q, $options: 'i' } },
        { email:     { $regex: q, $options: 'i' } },
      ];
    }
    const rows = await Fisherman.find(filter).sort({ firstName: 1, lastName: 1 }).lean();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load fishermen" });
  }
}
//HH

export function loginFisherman(req, res){
    req.body.role = "fisherman";
    return loginController(req, res);
}

/* -------------------------------------------------------------
   NEW: Get all fishermen - appended without changing structure
-------------------------------------------------------------- */
export async function getAllFishermen(req, res) {
  try {
    const docs = await Fisherman.find({}).select("-password -__v");
    return res.json({ fishermen: docs });
  } catch (err) {
    console.error("getAllFishermen error:", err);
    return res.status(500).json({ message: "Failed to fetch fishermen" });
  }
}

/* -------------------------------------------------------------
   ADMIN: Update fisherman by ID (mirrors your product pattern)
   Route: PATCH /api/fisherman/:id
-------------------------------------------------------------- */
export async function adminUpdateFisherman(req, res) {
  if (req.user == null) {
    res.status(403).json({
      message: "You need to log in to continue"
    });
    return;
  }

  if (req.user.role != "admin") {
    res.status(403).json({
      message: "You do not have permission to perform this action"
    });
    return;
  }

  try {
    await Fisherman.findOneAndUpdate(
      { _id: req.params.id },
      req.body
    );

    res.json({
      message: "Fisherman updated successfully"
    });
  } catch (err) {
    console.error("adminUpdateFisherman error:", err);
    res.status(500).json({
      message: "Fisherman not updated"
    });
  }
}

/* -------------------------------------------------------------
   ADMIN: Delete fisherman by ID (mirrors your product pattern)
   Route: DELETE /api/fisherman/:id
-------------------------------------------------------------- */
export async function adminDeleteFisherman(req, res) {
  if (req.user == null) {
    res.status(403).json({
      message: "You need to log in to continue"
    });
    return;
  }

  if (req.user.role != "admin") {
    res.status(403).json({
      message: "You do not have permission to perform this action"
    });
    return;
  }

  try {
    await Fisherman.findOneAndDelete({ _id: req.params.id });

    res.json({
      message: "Fisherman deleted successfully"
    });
  } catch (err) {
    console.error("adminDeleteFisherman error:", err);
    res.status(500).json({
      message: "Fisherman not deleted"
    });
  }
}
