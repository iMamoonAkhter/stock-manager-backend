var express = require("express");
var router = express.Router();

let { cart } = require("../../models/cart");
var auth = require("../../middlewares/auth");
var owner = require("../../middlewares/owner");

/* Get All cart */
router.get("/", async function (req, res) {
  try {
    let Cart = await cart.find().populate("cartItems.product");
    return res.send(Cart);
  } catch (error) {
    return res.status(500).send("Internal Error!");
  }
});

/* Add to cart */
router.post("/addtocart/:id/:t_id", async function (req, res) {
  try {
    const { id, t_id } = req.params; // User ID and Tenant ID
    const { product: productId, quantity } = req.body.cartItems; // Product ID and Quantity

    // Find the cart for the user and tenant
    let userCart = await cart.findOne({ user: id, tenant_id: t_id });

    if (userCart) {
      // Check if the product already exists in the cart
      const existingProduct = userCart.cartItems.find(
        (item) => item.product.toString() === productId
      );

      if (existingProduct) {
        // If the product exists, update its quantity
        existingProduct.quantity += quantity;
      } else {
        // If the product does not exist, add it to the cart
        userCart.cartItems.push(req.body.cartItems);
      }

      // Save the updated cart
      await userCart.save();
      return res.send("Cart updated successfully");
    } else {
      // If no cart exists, create a new one
      let newCart = new cart({
        user: id,
        tenant_id: t_id,
        cartItems: [req.body.cartItems],
      });

      await newCart.save();
      return res.json(newCart);
    }
  } catch (error) {
    console.error("Error in /addtocart route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/* Update quantity of an item in the cart */
router.put("/updatequantity/:id/:productId", async function (req, res) {
  try {
    const { id, productId } = req.params; // User ID and Product ID
    const { quantity } = req.body; // New quantity

    // Find the cart for the user
    let userCart = await cart.findOne({ user: id });

    if (!userCart) {
      return res.status(404).send("Cart not found");
    }

    // Find the product in the cart
    const productIndex = userCart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).send("Product not found in cart");
    }

    // Update the quantity
    userCart.cartItems[productIndex].quantity = quantity;

    // Save the updated cart
    await userCart.save();
    return res.send("Quantity updated successfully");
  } catch (error) {
    console.error("Error in /updatequantity route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/* Get Single cart */
router.get("/:id", async function (req, res) {
  try {
    let Cart = await cart
      .findOne({ user: req.params.id })
      .populate("cartItems.product");
    if (!Cart)
      return res.status(400).send("Cart with given Id does not exist");
    //console.log(Cart);
    return res.send(Cart);
  } catch (err) {
    return res.status(400).send("Invalid ID");
  }
});

/* Delete single item in cart */
router.delete("/:id/:productId", async function (req, res) {
  try {
    const { id, productId } = req.params;

    // Find the cart for the user
    let userCart = await cart.findOne({ user: id });

    if (!userCart) {
      return res.status(404).send("Cart not found");
    }

    // Remove the product from the cart
    userCart.cartItems = userCart.cartItems.filter(
      (item) => item.product.toString() !== productId
    );

    // Save the updated cart
    await userCart.save();
    return res.send("Item removed successfully");
  } catch (err) {
    return res.status(400).send("Invalid ID");
  }
});

/* Delete cart */
router.delete("/:id", async function (req, res) {
  try {
    let Cart = await cart.findByIdAndDelete(req.params.id);
    if (!Cart)
      return res.status(400).send("Cart with given Id does not exist");
    return res.send(Cart);
  } catch (err) {
    return res.status(400).send("Invalid ID");
  }
});

module.exports = router;