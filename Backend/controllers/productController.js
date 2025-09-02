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

    const product = new Product({
        productId : req.body.productId,
        name : req.body.name,
        altNames : req.body.altNames,
        price : req.body.price,
        labeledPrice : req.body.labeledPrice,
        description : req.body.description,
        images : req.body.images,
    })

    try{
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