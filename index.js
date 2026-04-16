const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// --- PUBLIC FOLDER SETUP ---
// Yeh line 'public' folder ki saari files (HTML, images) browser ko serve karegi
app.use(express.static(path.join(__dirname, "public")));

// Agar public/uploads folder nahi hai toh automatically create karega
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// --- MULTER SETUP ---
// Images seedha public/uploads/ me save hongi
const upload = multer({ dest: "public/uploads/" });

// Dummy DB & Secret Key
const users = [{ username: "Ridhima", password: "12345" }];
let todos = [];
const SECRET_KEY = "my_super_secret_key";

// --- JWT MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).send("Unauthorized");

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");
    req.user = user;
    next();
  });
};

// --- APIS ---

// 1. LOGIN API
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password,
  );

  if (user) {
    const token = jwt.sign({ username: user.username }, SECRET_KEY);
    res.json({ success: true, token });
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});

// 2. GET TODOS
app.get("/todos", authenticateToken, (req, res) => {
  res.json(todos);
});

// 3. ADD TODO (Multer ke sath)
app.post(
  "/todos",
  authenticateToken,
  upload.single("uploaded_file"),
  function (req, res, next) {
    const { task } = req.body;

    // URL set karna (Kyunki public static hai, hum direct /uploads/... se access kar sakte hain)
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newTodo = {
      id: Date.now(),
      task,
      imageUrl,
    };

    todos.push(newTodo);

    res.json({
      message: "Todo added",
      todo: newTodo,
    });
  },
);

// 4. DELETE TODO
app.delete("/todos/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  todos = todos.filter((t) => t.id !== id);
  res.json({ message: "Deleted successfully" });
});

// 5. UPDATE TODO
app.put("/todos/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const { task } = req.body;
  todos = todos.map((t) => (t.id === id ? { ...t, task } : t));
  res.json({ message: "Updated successfully" });
});

// --- SERVER START ---
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
  console.log("Open link: http://localhost:5000/login.html");
});
