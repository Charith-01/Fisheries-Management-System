import express from 'express';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.post('/create', createProduct);
productRouter.get('/all', getProducts);
productRouter.delete('/delete/:productId', deleteProduct);
productRouter.put('/update/:productId', updateProduct);

export default productRouter;