const express = require("express");
const mysql = require("mysql");
const crypto = require("crypto");
const app = express();
app.use(express.json());

var algorithm = "aes256";
var key = "password";
var con = mysql.createConnection({
  host: "127.0.0.1",
  port: "3306",
  user: "root",
  password: "aman0408",
  database: "password_keeper",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected to database!");
});
function encrypt(text) {
  encryptalgo = crypto.createCipher(algorithm, key);
  let encrypted = encryptalgo.update(text, "utf8", "hex");
  encrypted += encryptalgo.final("hex");
  return encrypted;
}

function decrypt(encrypted) {
  decryptalgo = crypto.createDecipher(algorithm, key);
  let decrypted = decryptalgo.update(encrypted, "hex", "utf8");
  decrypted += decryptalgo.final("utf8");
  return decrypted;
}

app.post("/app/user", function (req, res) {
  if (!req.body.username) {
    res.json({
      message: "username required",
    });
  }
  if (!req.body.password) {
    res.json({
      message: "password required",
    });
  }
  var q1 = "SELECT * FROM users WHERE username=?";
  con.query(q1, req.body.username, function (err, result) {
    if (err) {
      res.json({
        success: false,
        message: err.sqlMessage,
      });
    }
    if (result.length > 0) {
      res.json({
        success: false,
        message: "username already exists",
      });
    } else {
      var encrypted = encrypt(req.body.password);
      console.log(encrypted);
      var values = [req.body.username, encrypted];
      var query = "INSERT INTO users (username,password) VALUES (?)";
      con.query(query, [values], function (err, result) {
        if (err) {
          res.json({
            success: false,
            message: err.sqlMessage,
          });
        }
        res.json({
          success: true,
          message: "user created",
        });
      });
    }
  });
});

app.post("/app/user/auth", function (req, res) {
  if (!req.body.username) {
    res.json({
      success: false,
      message: "username required",
    });
  }
  if (!req.body.password) {
    res.json({
      success: false,
      message: "password required",
    });
  }
  var encrypted = encrypt(req.body.password);
  var query = "SELECT * FROM users where username = ? AND password= ?";
  con.query(query, [req.body.username, encrypted], function (err, result) {
    if (err) {
      res.json({
        success: false,
        message: err.sqlMessage,
      });
    }
    if (result.length > 0) {
      console.log(result[0].id);
      res.json({
        success: true,
        message: "success",
        userId: result[0].id,
      });
    } else {
      res.json({
        success: false,
        status: "failed",
        message: "incorrect username or password",
      });
    }
  });
});

//list saved notes
app.get("/app/sites/list", function (req, res) {
  console.log(req.query.user);
  var q1 = "SELECT * from users where id= ?";
  con.query(q1, [req.query.user], function (err, result) {
    if (err) {
      res.json({
        success: false,
        message: err.sqlMessage,
      });
    }
    console.log(result);
    if (result.length == 0) {
      res.json({
        success: false,
        message: "user not found",
      });
    } else {
      var query = "SELECT * FROM passwords where user_id = ?";
      con.query(query, req.query.user, function (err, result) {
        if (err) {
          res.json({
            success: false,
            message: err.sqlMessage,
          });
        }
        var a = [];
        for (var i = 0; i < result.length; i++) {
          var obj = {};
          obj["website"] = result[i].website;
          obj["username"] = result[i].username;
          obj["password"] = decrypt(result[i].password);
          a.push(obj);
        }
        res.json({
          success: true,
          data: a,
        });
      });
    }
  });
});
app.post("/app/sites", function (req, res) {
  if (!req.query.user) {
    res.json({
      success: false,
      message: "user id is required",
    });
  }
  if (!req.body.website) {
    res.json({
      success: false,
      message: "website is required",
    });
  }
  if (!req.body.username) {
    res.json({
      success: false,
      message: "username is required",
    });
  }
  if (!req.body.password) {
    res.json({
      success: false,
      message: "password is required",
    });
  }
  var q1 = "SELECT * from users where id= ?";
  con.query(q1, [req.query.user], function (err, result) {
    if (err) {
      throw err;
    }
    console.log(result);
    if (result.length == 0) {
      res.json({
        success: false,
        message: "user not found",
      });
    } else {
      var query =
        "INSERT INTO passwords (user_id,website,username,password) VALUES (?)";
      var values = [
        req.query.user,
        req.body.website,
        req.body.username,
        encrypt(req.body.password),
      ];
      con.query(query, [values], function (err, result) {
        if (err) {
          throw err;
        }
        res.json({
          success: true,
          message: "success",
        });
      });
    }
  });
});
var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Listening on port %d.", port);
});
