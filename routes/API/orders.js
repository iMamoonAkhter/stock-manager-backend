var express = require("express");
var router = express.Router();
var { order } = require("../../models/orders");
const { user } = require("../../models/users");
const { cart } = require("../../models/cart");
const { product } = require("../../models/products");

/* Get All orders */
router.get("/", async function (req, res) {
  try {
    let orders = await order.find().populate("user_id").populate("items.product");
    return res.send(orders);
  } catch (error) {
    console.error("Error in / route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/* Get orders w.r.t tenant */
router.get("/tenant/:id", async function (req, res) {
  try {
    let orders = await order
      .find({ tenant_id: req.params.id })
      .populate("user_id")
      .populate("items.product");
    return res.send(orders);
  } catch (error) {
    console.error("Error in /tenant/:id route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/* Get Sales */
router.get("/sales", async function (req, res) {
  try {
    let sales = await order
      .find({ OrderStatus: "Completed" })
      .populate("user_id")
      .populate("items.product");

    /*let sales = await order.aggregate([
      { $match: { OrderStatus: "Completed" } },
      { $unwind: "$items" },
      { $match: { OrderStatus: "Completed" } },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "Sales",
        },
      },
      {
        $group: {
          _id: {
            Product: "$Sales.name",
            Price: "$Sales.price",
          },
          Quantity: { $sum: "$items.quantity" },
        },
      },
    ]);*/
    return res.send(sales);
  } catch (error) {
    console.error("Error in /sales route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/* Get Sales w.r.t tenant */
router.get("/sales/:id", async function (req, res) {
  try {
    let sales = await order
      .find({ OrderStatus: "Completed", tenant_id: req.params.id })
      .populate("user_id")
      .populate("items.product");
    return res.send(sales);
  } catch (error) {
    console.error("Error in /sales/:id route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/* Get Single Order */
router.get("/:id", async function (req, res) {
  try {
    let Order = await order.findById(req.params.id);
    if (!Order)
      return res.status(400).send("Order with given Id does not exists");
    //console.log(Order);
    return res.send(Order);
  } catch (err) {
    return res.status(400).send("Invalid ID");
  }
});

/* Update Order */

/* Place Order */
/* Place Order */
router.post("/placeOrder/:id", async function (req, res) {
  try {
    let User = await user.findById(req.params.id);
    if (!User) return res.status(400).send("User with given Id does not exist");

    // Extract tenant_id from the first product in the cart
    const tenant_id = req.body.items[0].tenant_id;

    // Add tenant_id to the order payload
    const orderPayload = {
      ...req.body,
      tenant_id: tenant_id,
    };

    // Create the order
    let Order = await order.insertMany(orderPayload);

    // Clear the user's cart
    let Users = await cart.findOneAndDelete({ user: req.params.id });
    if (!Users) return res.status(400).send("User with given Id does not exist");

    return res.send({
      message: "Your order has been placed successfully",
      Order,
    });
  } catch (error) {
    console.error("Error in /placeOrder/:id route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/* Deliver Order */
// router.put("/:id", async function (req, res) {
//   try {
//     order.findByIdAndUpdate(
//       req.params.id,
//       { $set: { OrderStatus: "Completed" } },
//       { new: true },
//       (err, doc) => {
//         if (err) {
//           //console.log("Something wrong when updating data!");
//         }
//       }
//     );

//     return res.send("Order Status has been updated successfully");
//   } catch (err) {
//     return res.status(400).send("Invalid ID");
//   }
// });

/* Deliver Order */
router.put("/:id", async function (req, res) {
  try {
    order.findByIdAndUpdate(
      req.params.id,
      { $set: { OrderStatus: "Completed" } },
      { new: true },
      (err, doc) => {
        if (err) {
          //console.log("Something wrong when updating data!");
        }
      }
    );
    let Order = await order.findById(req.params.id);
    if (!Order)
      return res.status(400).send("Order with given Id does not exist");

    Order.items.forEach(async (o) => {
      await updateStock(o.product, o.quantity);
    });

    async function updateStock(id, quantity) {
      const Products = await product.findById(id);
      Products.stock -= quantity;
      await Products.save({ validateBeforeSave: false });
    }

    return res.send("Order Status has been updated successfully");
  } catch (err) {
    return res.status(400).send("Invalid ID");
  }
});

/* Delete Order */
router.delete("/:id", async function (req, res) {
  try {
    const orderId = req.params.id;

    // Find and delete the order
    const deletedOrder = await order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).send("Order with given Id does not exist");
    }

    return res.send("Order deleted successfully");
  } catch (error) {
    console.error("Error in /:id route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;