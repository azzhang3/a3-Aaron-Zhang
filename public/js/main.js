document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.querySelector("#registerForm");
  const loginForm = document.querySelector("#loginForm");
  const taskForm = document.querySelector("#taskForm");
  const taskSection = document.getElementById("taskSection");
  const inProgressTable = document.querySelector("#inProgressTable tbody");
  const completedTable = document.querySelector("#completedTable tbody");
  const logoutBtn = document.getElementById("logoutBtn");

  let tasks = [];
  let editingTaskId = null;

  // Handle registration
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;

    fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((response) =>
        response
          .json()
          .then((data) => ({ status: response.status, body: data }))
      )
      .then(({ status, body }) => {
        if (status === 201) {
          alert(body.message);
          registerForm.reset();
        } else {
          alert(body.message);
        }
      })
      .catch((error) => console.error("Error:", error));
  });

  // Handle login
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((response) =>
        response
          .json()
          .then((data) => ({ status: response.status, body: data }))
      )
      .then(({ status, body }) => {
        if (status === 200) {
          alert(body.message);
          showTaskSection();
          loadTasks();
        } else {
          alert(body.message);
        }
      })
      .catch((error) => console.error("Error:", error));
  });

  // Load tasks for the logged-in user
  function loadTasks() {
    fetch("/tasks")
      .then((response) => response.json())
      .then((data) => {
        tasks = data;
        renderTasks();
      })
      .catch((error) => console.error("Error:", error));
  }

  // Render tasks in the tables
  function renderTasks() {
    inProgressTable.innerHTML = "";
    completedTable.innerHTML = "";

    tasks.forEach((task) => {
      const daysLeft = calculateDaysLeft(task.dueDate);
      const row = document.createElement("tr");

      row.innerHTML = `
                <td>${task.task}</td>
                <td>${task.description}</td>
                <td>${task.creationDate}</td>
                <td>${task.dueDate}</td>
                <td>${daysLeft >= 0 ? daysLeft : "Past Due"}</td>
                <td>${task.priority}</td>
                <td>${task.status}</td>
                <td>
                    ${
                      task.status === "In Progress"
                        ? `<button class="edit-btn" onclick="editTask('${task._id}')">Edit</button>
                     <button class="complete-btn" onclick="completeTask('${task._id}')">Complete</button>
                     <button class="delete-btn" onclick="deleteTask('${task._id}')">Delete</button>`
                        : `<button class="in-progress-btn" onclick="markInProgress('${task._id}')">Mark In Progress</button>
                     <button class="delete-btn" onclick="deleteTask('${task._id}')">Delete</button>`
                    }
                </td>
            `;

      if (task.status === "In Progress") {
        inProgressTable.appendChild(row);
      } else {
        completedTable.appendChild(row);
      }
    });
  }

  // Edit a task
  window.editTask = (taskId) => {
    const taskToEdit = tasks.find((task) => task._id === taskId);
    document.getElementById("task").value = taskToEdit.task;
    document.getElementById("description").value = taskToEdit.description;
    document.getElementById("date").value = taskToEdit.dueDate;
    document.getElementById("priority").value = taskToEdit.priority;

    editingTaskId = taskId; // Track task being edited
    taskForm.querySelector('button[type="submit"]').textContent = "Update Task";
  };

  // Handle task form submission
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const task = document.getElementById("task").value;
    const description = document.getElementById("description").value;
    const dueDate = document.getElementById("date").value;
    const priority = document.getElementById("priority").value;

    if (editingTaskId) {
      // Update existing task
      fetch(`/edit/${editingTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, description, dueDate, priority }),
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.message);
          loadTasks();
          editingTaskId = null;
          taskForm.reset();
          taskForm.querySelector('button[type="submit"]').textContent =
            "Submit Task";
        })
        .catch((error) => console.error("Error:", error));
    } else {
      // Add new task
      fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, description, dueDate, priority }),
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.message);
          loadTasks();
          taskForm.reset();
        })
        .catch((error) => console.error("Error:", error));
    }
  });

  // Delete a task
  window.deleteTask = (taskId) => {
    fetch(`/delete/${taskId}`, { method: "DELETE" })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        loadTasks();
      })
      .catch((error) => console.error("Error:", error));
  };

  // Mark task as completed
  window.completeTask = (taskId) => {
    fetch(`/complete/${taskId}`, { method: "PUT" })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        loadTasks();
      })
      .catch((error) => console.error("Error:", error));
  };

  // Mark task as "In Progress"
  window.markInProgress = (taskId) => {
    fetch(`/in-progress/${taskId}`, { method: "PUT" })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        loadTasks();
      })
      .catch((error) => console.error("Error:", error));
  };

  // Calculate days left until the due date
  function calculateDaysLeft(dueDate) {
    const currentDate = new Date();
    const dueDateObj = new Date(dueDate);
    const timeDifference = dueDateObj - currentDate;
    return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  }

  // Show the task management section after login
  function showTaskSection() {
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    loginText.style.display = "none";
    registerText.style.display = "none";
    taskSection.style.display = "block";
  }

  // Logout
  logoutBtn.addEventListener("click", () => {
    fetch("/logout")
      .then(() => {
        alert("Logged out successfully");
        location.reload();
      })
      .catch((error) => console.error("Error:", error));
  });
});
