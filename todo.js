const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.set('json spaces', 4);

let todos = [
    { id: 1, task: "Complete ITPM Assignment", completed: false },
    { id: 2, task: "complete all api", completed: false }
];

// 1. Get All Todos
app.get('/todos', (req, res) => {
    res.json(todos);
});

// 2. Get Selective Todo (By ID)
app.get('/todos/:id', (req, res) => {
    const todo = todos.find(t => t.id === parseInt(req.params.id));
    if (!todo) return res.status(404).json({ message: "Todo not found" });
    res.json(todo);
});

// 3. Create Todo
app.post('/todos', (req, res) => {
    const newTodo = {
        id: todos.length + 1,
        task: req.body.task,
        completed: false
    };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

// 4. Update Todo
app.put('/todos/:id', (req, res) => {
    const todo = todos.find(t => t.id === parseInt(req.params.id));
    if (!todo) return res.status(404).json({ message: "Todo not found" });

    todo.task = req.body.task !== undefined ? req.body.task : todo.task;
    todo.completed = req.body.completed !== undefined ? req.body.completed : todo.completed;

    res.json(todo);
});

// 5. Delete Todo
app.delete('/todos/:id', (req, res) => {
    const index = todos.findIndex(t => t.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ message: "Todo not found" });

    const deletedTodo = todos.splice(index, 1);
    res.json({ message: "Deleted successfully", todo: deletedTodo });
});

app.listen(PORT, () => {
    console.log(`Todo API running at http://localhost:${PORT}`);
});