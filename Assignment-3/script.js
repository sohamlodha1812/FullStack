const form = document.getElementById("studentForm");
const studentTable = document.getElementById("studentTable");
const topperDiv = document.getElementById("topper");

let students = [];

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const roll = document.getElementById("roll").value.trim();
    const name = document.getElementById("name").value.trim();

    const marks = [
        Number(document.getElementById("m1").value),
        Number(document.getElementById("m2").value),
        Number(document.getElementById("m3").value),
        Number(document.getElementById("m4").value),
        Number(document.getElementById("m5").value)
    ];

    // Validate marks
    if (marks.some(mark => mark < 0 || mark > 100)) {
        alert("Marks must be between 0 and 100.");
        return;
    }

    // Prevent duplicate roll numbers
    if (students.some(student => student.roll === roll)) {
        alert("Roll number already exists!");
        return;
    }

    // Calculate total and percentage
    const total = marks.reduce((sum, mark) => sum + mark, 0);
    const percentage = total / marks.length;

    // Calculate grade
    let grade;

    if (percentage >= 90) {
        grade = "A+";
    } else if (percentage >= 80) {
        grade = "A";
    } else if (percentage >= 70) {
        grade = "B";
    } else if (percentage >= 60) {
        grade = "C";
    } else if (percentage >= 40) {
        grade = "D";
    } else {
        grade = "F";
    }

    // Create student object
    const student = {
        roll,
        name,
        total,
        percentage,
        grade
    };

    // Store student record
    students.push(student);

    // Update table and topper
    displayStudents();
    displayTopper();

    // Clear form
    form.reset();
});

function displayStudents() {
    studentTable.innerHTML = "";

    students.forEach(student => {
        const row = document.createElement("tr");

        [
            student.roll,
            student.name,
            student.total,
            student.percentage.toFixed(2) + "%",
            student.grade
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        studentTable.appendChild(row);
    });
}

function displayTopper() {
    if (students.length === 0) {
        topperDiv.textContent = "No student records available.";
        return;
    }

    const topper = students.reduce((best, student) =>
        student.percentage > best.percentage ? student : best
    );

    topperDiv.textContent =
        `Topper: ${topper.name} | Roll No: ${topper.roll} | ` +
        `Percentage: ${topper.percentage.toFixed(2)}%`;
}