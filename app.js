const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt-nodejs");
const app = express();
const knex = require("knex");
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

const port = 3001;

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    port: 5432,
    password: "12345.",
    database: "blog",
  },
});

app.get("/", (req, res) => {
  res.json("success");
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const hash = bcrypt.hashSync(password);
  res.json("registered");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json("incorrect form submission");
  }

  console.log(hash);
  db.select("email", "hash")
    .from("login")
    .where("email", "=", req.body.email)
    .then((data) => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", req.body.email)
          .then((user) => {
            res.json(user[0]);
          })
          .catch((err) => res.status(400).json("unable to get user"));
      }
    })
    .catch((err) => res.status(400).json("wrong credentials"));
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
