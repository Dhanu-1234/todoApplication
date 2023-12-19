const { format, isValid } = require("date-fns");
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializer();

const authenticateParamsValues = (request, response, next) => {
  const {
    category = "WORK",
    priority = "HIGH",
    status = "TO DO",
    date,
  } = request.query;
  const dueDate = new Date(date);
  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(dueDate)) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

const authenticateBodyValues = (request, response, next) => {
  const {
    category = "WORK",
    priority = "HIGH",
    status = "TO DO",
    date,
  } = request.body;
  const dueDate = new Date(date);
  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(dueDate)) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

const convertResponseObj = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  };
};

//API 1 todos
app.get("/todos", authenticateParamsValues, async (request, response) => {
  const {
    category,
    priority,
    status,
    date = "2020-12-12",
    search_q,
  } = request.query;
  const dueDate = format(new Date(date), "yyyy-MM-dd");
  let getTodosQuery;
  if (status !== undefined && priority !== undefined) {
    getTodosQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        status = '${status}'
        AND priority = '${priority}';`;
  } else if (status !== undefined && category !== undefined) {
    getTodosQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        status = '${status}'
        AND category = '${category}';`;
  } else if (priority !== undefined && category !== undefined) {
    getTodosQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        category = '${category}'
        AND priority = '${priority}';`;
  } else if (status !== undefined) {
    getTodosQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        status = '${status}';`;
  } else if (priority !== undefined) {
    getTodosQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        priority = '${priority}';`;
  } else if (category !== undefined) {
    getTodosQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        category = '${category}';`;
  } else if (search_q !== undefined) {
    getTodosQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        todo LIKE '%${search_q}%';`;
  } else {
    getTodosQuery = `
      SELECT
        *
      FROM
        todo;`;
  }
  const dbResponse = await db.all(getTodosQuery);
  const responseArray = dbResponse.map((eachObj) =>
    convertResponseObj(eachObj)
  );
  response.send(responseArray);
});

//API 2 get todo by todo ID
app.get(
  "/todos/:todoId",
  authenticateParamsValues,
  async (request, response) => {
    const { todoId } = request.params;
    const getTodoQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        id = ${todoId};`;
    const dbResponse = await db.get(getTodoQuery);
    const responseObj = convertResponseObj(dbResponse);
    response.send(responseObj);
  }
);

//API 3 get todo by Date
app.get("/agenda", authenticateParamsValues, async (request, response) => {
  const { date } = request.query;
  const dueDate = format(new Date(date), "yyyy-MM-dd");
  const getTodoQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        due_date = '${dueDate}';`;
  const dbResponse = await db.all(getTodoQuery);
  const responseArray = dbResponse.map((eachObj) =>
    convertResponseObj(eachObj)
  );
  response.send(responseArray);
});

//API 4 Create Todo
app.post("/todos", authenticateBodyValues, async (request, response) => {
  const { todo, category, priority, status, date } = request.body;
  const addTodoQuery = `
  INSERT INTO
    todo(todo,category,priority,status,due_date)
  VALUES
    (
        '${todo}',
        '${category}',
        '${priority}',
        '${status}',
        '${date}'
    );`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5 update todo by todo ID
app.put("/todos/:todoId", authenticateBodyValues, async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        id = ${todoId};`;
  const dbResponse = await db.get(getTodoQuery);
  const {
    todo = dbResponse.todo,
    category = dbResponse.category,
    priority = dbResponse.priority,
    status = dbResponse.status,
    dueDate = dbResponse.due_date,
  } = request.body;
  const updateTodoQuery = `
    UPDATE
        todo
    SET
        todo = '${todo}',
        category = '${category}',
        priority = '${priority}',
        status = '${status}',
        due_date = '${dueDate}'
    WHERE
        id = ${todoId};`;
  await db.run(updateTodoQuery);
  const sendingResponse = () => {
    const { todo, category, priority, status, dueDate } = request.body;
    if (todo !== undefined) {
      response.send("Todo Updated");
    } else if (category !== undefined) {
      response.send("Category Updated");
    } else if (priority !== undefined) {
      response.send("Priority Updated");
    } else if (status !== undefined) {
      response.send("Status Updated");
    } else if (dueDate !== undefined) {
      response.send("Due Date Updated");
    }
  };
  sendingResponse();
});

//API 6 delete todo with todo ID
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
        todo
    WHERE
        id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
