const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt-nodejs");
const app = express();
const knex = require("knex");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

const PORT = 3001;

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
  if (!name || !email || !password) {
    return res.status(400).json("incorrect form submission");
  }

  const hash = bcrypt.hashSync(password);
  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        email: email,
      })
      .into("login")
      .returning("email")
      .then((loginEmail) => {
        return trx("users")
          .returning("*")
          .insert({
            email: loginEmail[0].email,
            name: name,
          })
          .then((user) => {
            res.json(user[0]);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch(() => res.status(400).json("unable to register"));
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json("incorrect form submission");
  }
  db.select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", email)
          .then((user) => {
            res.json(user[0]);
          })
          .catch(() => res.status(400).json("unable to get user"));
      } else {
        res.status(400).json("wrong credentials");
      }
    })
    .catch(() => res.status(400).json("wrong credentials"));
});

app.post("/admin", (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json("incorrect form submission");
  }

  db.insert({
    title: title,
    description: description,
    created_on: new Date(),
  })
    .into("posts")
    .then((post) => {
      res.json(post[0]);
    })
    .catch(() => res.status(400).json("unable to insert"));
});

app.get("/posts", (req, res) => {
  db.select("*")
    .from("posts")
    .then((posts) => {
      res.json(posts);
    });
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`App listening on port ${PORT}`);
});
