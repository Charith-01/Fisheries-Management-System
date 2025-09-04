import Product from "../models/product.js";

export async function createProduct(req, res){
    if(req.user == null){
        res.status(403).json({
            message : "You need to log in to continue"
        })
        return;
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message : "You do not have permission to perform this action"
        })
        return;
    }

    try{
        const lastProducts = await Product.find().sort({ createdAt: -1 }).limit(1);
        let newProductId = "";
        if(lastProducts.length === 0){
            newProductId = "PRD0001";
        } else {
            const lastProduct = lastProducts[0];
            const lastId = lastProduct.productId; // e.g., PRD0001
            const lastNumber = lastId.replace("PRD", ""); // "0001"
            const lastInt = parseInt(lastNumber); // 1
            const newInt = lastInt + 1; // 2
            const newStr = newInt.toString().padStart(4, "0"); // "0002"
            newProductId = "PRD" + newStr; // PRD0002
        }

        const product = new Product({
            productId : newProductId,
            name : req.body.name,
            altNames : req.body.altNames,
            category : req.body.category,
            unit : req.body.unit,
            price : req.body.price,
            labeledPrice : req.body.labeledPrice,
            description : req.body.description,
            images : req.body.images,
            stock : req.body.stock,
            isActive : req.body.isActive
        })
        
        await product.save();
        res.json({
            message : "Product created successfully"
        })
    } catch(err){
        res.status(500).json({
            message : "Product not created"
        });
    }
}

export async function getProducts(req, res){
    try{
        const products = await Product.find();
        res.json({
            message : "Products fetched successfully",
            data : products
        })
    } catch(err){
        res.status(500).json({
            message: "Products not fetched"
        })
    }
}

export async function deleteProduct(req, res){
    if(req.user == null){
        res.status(403).json({
            message : "You need to log in to continue"
        })
        return;
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message: "You do not have permission to perform this action"
        })
        return;
    }

    try{
        await Product.findOneAndDelete({
            productId : req.params.productId
        });

        res.json({
            message: "Product deleted successfull"
        })
    } catch(err){
        res.status(500).json({
            message: "Product not deleted"
        })
    }
}

export async function updateProduct(req, res){
    if(req.user == null){
        res.status(403).json({
            message: "You need to log in to continue"
        })
        return;
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message: "You do not have permission to perform this action"
        })
        return;
    }

    try{
        await Product.findOneAndUpdate({
            productId : req.params.productId
        }, req.body);

        res.json({
            message: "Product updated successfully"
        })
    } catch(err){
        res.status(500).json({
            message: "Product not updated"
        })
    }
}