const express = require("express");
const router = express.Router();
const validateProduct = require("../../middlewares/validateProduct");
const { product } = require("../../models/products");
const { category } = require("../../models/categories");
const auth = require("../../middlewares/auth");
const owner = require("../../middlewares/owner");
const { tenant } = require("../../models/tenants");

// Import custom multer middleware and Cloudinary utility
const {upload} = require("../../middlewares/multer.middlewares.js");
const { uploadOnCloudinary } = require("../../utils/cloudinary");

/* Get All Products */
router.get("/", async function (req, res) {
  try {
    let products = await product.find().populate("category");
    return res.send(products);
  } catch (error) {
    console.error("Error in / route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/* Get Single Product */
router.get("/:id", async function (req, res) {
  try {
    let Product = await product.findById(req.params.id);
    if (!Product)
      return res.status(400).send("Product with given Id does not exists");
    //console.log(Product);
    return res.send(Product);
  } catch (err) {
    return res.status(400).send("Invalid ID");
  }
});

/* Get Products by Tenant */
router.get("/tenant/:id", async function (req, res) {
  try {
    let Product = await product.find({ Tenant_id: req.params.id });
    if (!Product)
      return res.status(400).send("Product with given Id does not exists");
    //console.log(Product);
    return res.send(Product);
  } catch (err) {
    return res.status(400).send("Invalid ID");
  }
});

/* Update Product */
router.put(
  "/:id",
  upload.single("image"),
  validateProduct,
  async function (req, res) {
    try {
      let Product = await product.findById(req.params.id);
      if (!Product)
        return res.status(400).send("Product with given Id does not exists");

      // Upload image to Cloudinary
      if (req.file) {
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        if (!cloudinaryResponse) {
          return res.status(500).send("Failed to upload image to Cloudinary");
        }
        Product.picture = cloudinaryResponse.url; // Save Cloudinary URL
      }

      Product.Tenant_id = req.body.Tenant_id;
      Product.name = req.body.name;
      Product.price = req.body.price;
      Product.category = req.body.category;
      Product.color = req.body.color;
      Product.stock = req.body.stock;
      Product.id = req.body.id;
      Product.description = req.body.description;
      Product.date = req.body.date;
      Product.time = req.body.time;

      await Product.save();
      return res.send(Product);
    } catch (err) {
      return res.status(400).send("Invalid ID");
    }
  }
);

/* Add Product */
router.post("/", upload.single("image"), async function (req, res) {
  try {
    let Category = await category.findOne({ name: req.body.category });
    if (!Category)
      return res.status(400).send("Category with this name does not exist");

    let Tenant = await tenant.find({ "Tenant.Tenant_id": "req.body.Tenant_id" });
    if (!Tenant) return res.status(400).send("Tenant not found");

    // Upload image to Cloudinary
    let pictureUrl = null;
    if (req.file) {
      const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
      if (!cloudinaryResponse) {
        return res.status(500).send("Failed to upload image to Cloudinary");
      }
      pictureUrl = cloudinaryResponse.url; // Save Cloudinary URL
    }

    let Product = new product();
    Product.Tenant_id = req.body.Tenant_id;
    Product.name = req.body.name;
    Product.price = req.body.price;
    Product.category = req.body.category;
    Product.color = req.body.color;
    Product.picture = pictureUrl; // Use Cloudinary URL
    Product.stock = req.body.stock;
    Product.id = req.body.id;
    Product.description = req.body.description;
    Product.date = req.body.date;
    Product.time = req.body.time;

    await Product.save();
    return res.send(Product);
  } catch (error) {
    console.error("Error in / route:", error);
    return res.status(400).send("Unsuccessful attempt: " + error.message);
  }
});

/* Delete Product */
router.delete("/:id", async function (req, res) {
  try {
    let Product = await product.findById(req.params.id);
    if (!Product)
      return res.status(400).send("Product with given Id does not exists");

    // Extract public_id from Cloudinary URL
    if (Product.picture) {
      const publicId = Product.picture.split("/").pop().split(".")[0]; // Extract public_id from URL
      await deleteOnCloudinary(publicId); // Delete image from Cloudinary
    }

    // Delete product from database
    await product.findByIdAndDelete(req.params.id);

    return res.send(Product);
  } catch (err) {
    return res.status(400).send("Invalid ID");
  }
});

module.exports = router;