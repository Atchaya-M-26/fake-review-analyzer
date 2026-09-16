const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get product details
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ productId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Create/update product
router.post('/', async (req, res) => {
  try {
    const { productName, productUrl, platform, sku } = req.body;

    let product = await Product.findOne({ productUrl });
    
    if (product) {
      Object.assign(product, req.body);
    } else {
      product = new Product(req.body);
    }

    await product.save();
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product saved successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error saving product',
      error: error.message
    });
  }
});

module.exports = router;
