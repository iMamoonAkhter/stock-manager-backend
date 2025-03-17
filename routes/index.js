var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Welcome to the API');
});

router.get('/favicon.ico', (req, res) => res.status(204).end())

module.exports = router;
