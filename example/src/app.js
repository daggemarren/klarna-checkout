// Generated by CoffeeScript 1.10.0
(function() {
  var app, bodyParser, cfg, colors, err, error1, error2, error3, express, fs, klarna, order2html, server;

  try {
    express = require("express");
    klarna = require("klarna-checkout");
    bodyParser = require("body-parser");
    colors = require("colors");
    fs = require("fs");
  } catch (error1) {
    err = error1;
    console.log("ERROR! Required modules not installed. Please run 'npm install'\n".red);
    return;
  }

  try {
    cfg = fs.readFileSync('credentials.json', 'utf-8');
  } catch (error2) {
    err = error2;
    console.error("ERROR! 'credentials.json' not found. Please run 'npm run-script setup'.\n".red);
    return;
  }

  try {
    cfg = JSON.parse(cfg);
  } catch (error3) {
    err = error3;
    console.error("ERROR! Invalid 'credentials.json' file. Please run 'npm run-script setup'.\n".red);
    return;
  }

  klarna.init({
    eid: cfg.eid,
    secret: cfg.secret
  });

  klarna.config({
    terms_uri: 'http://www.example.com',
    cancellation_terms_uri: 'http://www.example.com',
    checkout_uri: 'http://www.example.com',
    confirmation_uri: 'http://localhost:3000/confirmation?klarna_order_id={checkout.order.id}',
    push_uri: 'http://www.example.com'
  });

  app = express();

  app.use(bodyParser.json());

  app.use(express["static"]('public'));

  order2html = function(order) {
    var html, key, value, value2;
    html = '';
    for (key in order) {
      value = order[key];
      if (typeof value === 'object') {
        html += '<strong>' + key + '</strong><br>';
        for (key in value) {
          value2 = value[key];
          if (key === 'snippet') {
            value2 = '(We don\'t want to render this now...)';
          }
          html += '&nbsp;&nbsp;' + key + ': ' + value2 + '<br>';
        }
      } else {
        html += key + ': ' + value + '<br>';
      }
    }
    return html;
  };

  app.post('/order', function(req, res) {
    console.log("Placing order");
    return klarna.place(req.body).then(function(id) {
      return klarna.fetch(id);
    }, function(error) {
      return res.status(500).send(error);
    }).then(function(order) {
      console.log("Snippet received");
      return res.send(order.gui.snippet);
    }, function(error) {
      return res.status(500).send(error);
    });
  });

  app.get('/confirmation', function(req, res) {
    var id;
    console.log("Confirming order");
    id = req.query.klarna_order_id;
    return klarna.confirm(id, '1000').then(function(order) {
      var html;
      console.log("Order confirmed");
      html = order.gui.snippet;
      html += '<div style="font-family: Helvetica, sans-serif; text-align: center"><a href="/order/' + id + '">View order</a>';
      return res.send(html);
    }, function(error) {
      return res.status(500).send(error);
    });
  });

  app.get('/order/:id', function(req, res) {
    var id;
    id = req.params.id;
    return klarna.fetch(id).then(function(order) {
      return res.send(order2html(order));
    }, function(error) {
      return res.status(500).send(error);
    });
  });

  server = app.listen(3000, 'localhost', function() {
    var port;
    port = server.address().port;
    console.log("Klarna Checkout example server is up and running!".green);
    return console.log(("Visit http://localhost:" + port + " in a browser to try it.").green);
  });

}).call(this);
