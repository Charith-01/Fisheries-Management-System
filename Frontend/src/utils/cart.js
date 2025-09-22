export default function getCart(){

    let cart = localStorage.getItem("cart");

    if(cart == null){
        cart = [];
        localStorage.setItem("cart", JSON.stringify(cart));
        return [];
    }

    cart = JSON.parse(cart);
    return cart;
}

export function addToCart(product, qty){
    let cart = getCart();
    const q = Number(qty) || 0;

    const productIndex = cart.findIndex((item) => item.productId === product.productId);

    if(productIndex === -1){
        cart.push(
            {
                productId: product.productId,
                name: product.name,
                altNames: product.altNames,
                price: product.price,
                labeledPrice: product.labeledPrice,
                unit: product.unit,
                image: (product.images && product.images[0]) || null,
                quantity: q
            }
        );
    }else{
        cart[productIndex].quantity = (Number(cart[productIndex].quantity) || 0) + q;

        if(cart[productIndex].quantity <= 0){

            cart = cart.filter((item) => item.productId !== product.productId);
        }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart:updated"));

    return cart;
}

export function removeFromCart(productId){
    let cart = getCart();
    cart = cart.filter((item) => item.productId !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart:updated"));
    return cart;
}
