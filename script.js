
const STORAGE_KEY = "taskflow_tasks";

let tasks = [];
let currentFilter = "all";
let editingId = null;

try {
  const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  tasks = Array.isArray(savedTasks) ? savedTasks : [];
} catch {
  tasks = [];
}

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const addButton = document.getElementById("addButton");
const cancelButton = document.getElementById("cancelButton");
const searchInput = document.getElementById("searchInput");
const priorityFilter = document.getElementById("priorityFilter");

const titleInput = document.getElementById("taskTitle");
const descriptionInput = document.getElementById("taskDescription");
const priorityInput = document.getElementById("taskPriority");
const dueDateInput = document.getElementById("taskDueDate");
const statusInput = document.getElementById("taskStatus");

const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveButton");
const listTitle = document.getElementById("listTitle");

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function openForm(task = null) {
  taskForm.reset();
  editingId = task ? task.id : null;

  formTitle.textContent = task ? "Edit Task" : "Create a New Task";
  saveButton.textContent = task ? "Update Task" : "Save Task";

  if (task) {
    titleInput.value = task.title;
    descriptionInput.value = task.description || "";
    priorityInput.value = task.priority;
    dueDateInput.value = task.dueDate || "";
    statusInput.value = task.status;
  } else {
    statusInput.value = "todo";
    priorityInput.value = "Medium";
  }

  taskForm.hidden = false;
  titleInput.focus();
}

function closeForm() {
  taskForm.hidden = true;
  taskForm.reset();
  editingId = null;
}

function getStatusLabel(status) {
  const labels = {
    todo: "To Do",
    progress: "In Progress",
    completed: "Completed"
  };

  return labels[status] || "To Do";
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function addPill(container, text, extraClass = "") {
  const pill = makeElement("span", `pill ${extraClass}`, text);
  container.appendChild(pill);
}

function createTaskCard(task) {
  const card = makeElement("article", "task-card");
  const content = makeElement("div", "task-content");
  const title = makeElement("h3", "", task.title);

  if (task.status === "completed") {
    title.classList.add("status-completed");
  }

  content.appendChild(title);

  if (task.description) {
    content.appendChild(
      makeElement("p", "task-description", task.description)
    );
  }

  const meta = makeElement("div", "task-meta");

  addPill(meta, getStatusLabel(task.status));
  addPill(
    meta,
    task.priority + " Priority",
    task.priority === "High"
      ? "priority-high"
      : task.priority === "Low"
        ? "priority-low"
        : ""
  );

  if (task.dueDate) {
    addPill(meta, "Due: " + task.dueDate);
  }

  content.appendChild(meta);

  const actions = makeElement("div", "task-actions");

  const statusButton = makeElement(
    "button",
    "",
    task.status === "completed" ? "Reopen" : "Next Status"
  );

  statusButton.type = "button";
  statusButton.setAttribute(
    "aria-label",
    "Change status for " + task.title
  );

  statusButton.addEventListener("click", () => {
    if (task.status === "todo") {
      task.status = "progress";
    } else if (task.status === "progress") {
      task.status = "completed";
    } else {
      task.status = "todo";
    }

    saveTasks();
    renderTasks();
  });

  const editButton = makeElement("button", "", "Edit");
  editButton.type = "button";
  editButton.addEventListener("click", () => openForm(task));

  const deleteButton = makeElement(
    "button",
    "delete-button",
    "Delete"
  );

  deleteButton.type = "button";
  deleteButton.addEventListener("click", () => {
    const confirmed = confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    tasks = tasks.filter(item => item.id !== task.id);
    saveTasks();
    renderTasks();
  });

  actions.append(statusButton, editButton, deleteButton);
  card.append(content, actions);

  return card;
}

function renderTasks() {
  taskList.replaceChildren();

  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedPriority = priorityFilter.value;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm) ||
      (task.description || "").toLowerCase().includes(searchTerm);

    const matchesPriority =
      selectedPriority === "all" ||
      task.priority === selectedPriority;

    let matchesStatus = true;

    if (currentFilter === "active") {
      matchesStatus = task.status === "todo";
    } else if (currentFilter === "progress") {
      matchesStatus = task.status === "progress";
    } else if (currentFilter === "completed") {
      matchesStatus = task.status === "completed";
    }

    return matchesSearch && matchesPriority && matchesStatus;
  });

  filteredTasks.forEach(task => {
    taskList.appendChild(createTaskCard(task));
  });

  emptyMessage.hidden = filteredTasks.length !== 0;

  document.getElementById("totalCount").textContent = tasks.length;
  document.getElementById("todoCount").textContent =
    tasks.filter(task => task.status === "todo").length;
  document.getElementById("progressCount").textContent =
    tasks.filter(task => task.status === "progress").length;
  document.getElementById("completedCount").textContent =
    tasks.filter(task => task.status === "completed").length;
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = titleInput.value.trim();

  if (!title) {
    alert("Please enter a task title.");
    titleInput.focus();
    return;
  }

  const taskData = {
    title,
    description: descriptionInput.value.trim(),
    priority: priorityInput.value,
    dueDate: dueDateInput.value,
    status: statusInput.value
  };

  if (editingId !== null) {
    tasks = tasks.map(task =>
      task.id === editingId ? { ...task, ...taskData } : task
    );
  } else {
    tasks.unshift({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      ...taskData,
      createdAt: new Date().toISOString()
    });
  }

  saveTasks();
  closeForm();
  renderTasks();
});

addButton.addEventListener("click", () => {
  openForm();
});

cancelButton.addEventListener("click", closeForm);

searchInput.addEventListener("input", renderTasks);
priorityFilter.addEventListener("change", renderTasks);

document.querySelectorAll(".nav[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll(".nav[data-filter]").forEach(nav => {
      nav.classList.toggle("active", nav === button);
    });

    const titles = {
      all: "All Tasks",
      active: "Pending Tasks",
      progress: "In Progress",
      completed: "Completed Tasks"
    };

    listTitle.textContent = titles[currentFilter];
    renderTasks();
  });
});

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "taskflow_dark_mode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
});

if (localStorage.getItem("taskflow_dark_mode") === "on") {
  document.body.classList.add("dark");
}

renderTasks();
