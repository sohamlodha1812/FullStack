const form = document.getElementById("employeeForm");
const successMessage = document.getElementById("successMessage");
const employeeTable = document.getElementById("employeeTable");

const employees = [];

function showError(field, message) {
    document.getElementById(field + "Error").textContent = message;
}

function clearErrors() {
    ["name", "email", "password", "phone", "department"].forEach(field => {
        showError(field, "");
    });

    successMessage.style.display = "none";
}

function validateForm() {
    clearErrors();

    let valid = true;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const phone = document.getElementById("phone").value.trim();
    const department = document.getElementById("department").value;

    // Validate name
    if (name.length < 3 || !/^[A-Za-z ]+$/.test(name)) {
        showError("name", "Enter a valid name using letters and spaces (minimum 3 characters).");
        valid = false;
    }

    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        showError("email", "Please enter a valid email address.");
        valid = false;
    } else if (employees.some(employee =>
        employee.email.toLowerCase() === email.toLowerCase()
    )) {
        showError("email", "This email address is already registered.");
        valid = false;
    }

    // Validate password
    if (password.length < 8) {
        showError("password", "Password must contain at least 8 characters.");
        valid = false;
    } else if (!/[A-Za-z]/.test(password) ||
               !/[0-9]/.test(password)) {
        showError("password", "Password must contain at least one letter and one number.");
        valid = false;
    }

    // Validate phone number
    if (!/^[6-9]\d{9}$/.test(phone)) {
        showError("phone", "Enter a valid 10-digit Indian mobile number.");
        valid = false;
    }

    // Validate department
    if (department === "") {
        showError("department", "Please select a department.");
        valid = false;
    }

    return valid;
}

form.addEventListener("submit", function(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const employee = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        department: document.getElementById("department").value
    };

    employees.push(employee);

    // Create a table row safely
    const row = document.createElement("tr");

    [
        employee.name,
        employee.email,
        employee.phone,
        employee.department
    ].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
    });

    employeeTable.appendChild(row);

    successMessage.textContent =
        "Employee " + employee.name + " registered successfully!";

    successMessage.style.display = "block";

    form.reset();
});