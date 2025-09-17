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
    let cart = getCart(); // was const; needs let because we may reassign after filter
    const q = Number(qty) || 0; // ensure numeric

    // avoid shadowing: compare each item's id to the incoming product's id
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
                image: (product.images && product.images[0]) || null, // safe access
                quantity: q
            }
        );
    }else{
        // make sure current quantity is numeric before adding
        cart[productIndex].quantity = (Number(cart[productIndex].quantity) || 0) + q;

        if(cart[productIndex].quantity <= 0){
            // remove this item if quantity is now zero/negative
            cart = cart.filter((item) => item.productId !== product.productId);
        }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    // 🔔 notify same-tab listeners (Cart page, Header badge, etc.)
    window.dispatchEvent(new Event("cart:updated"));

    return cart;
}

export function removeFromCart(productId){
    let cart = getCart();
    cart = cart.filter((item) => item.productId !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));
    // 🔔 notify same-tab listeners
    window.dispatchEvent(new Event("cart:updated"));
    return cart;
}
