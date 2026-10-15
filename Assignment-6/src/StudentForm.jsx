
import { useState } from "react";

function StudentForm({ onSubmit }) {
  const [student, setStudent] = useState({
    name: "",
    rollNumber: "",
    department: "",
    marks: ""
  });

  const handleChange = (e) => {
    setStudent({
      ...student,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(student);

    setStudent({
      name: "",
      rollNumber: "",
      department: "",
      marks: ""
    });
  };

  return (
    <form onSubmit={handleSubmit} className="student-form">
      <label>Student Name</label>
      <input
        name="name"
        value={student.name}
        onChange={handleChange}
        required
      />

      <label>Roll Number</label>
      <input
        name="rollNumber"
        value={student.rollNumber}
        onChange={handleChange}
        required
      />

      <label>Department</label>
      <select
        name="department"
        value={student.department}
        onChange={handleChange}
        required
      >
        <option value="">Select Department</option>
        <option value="Information Technology">
          Information Technology
        </option>
        <option value="Computer Engineering">
          Computer Engineering
        </option>
        <option value="Mechanical Engineering">
          Mechanical Engineering
        </option>
      </select>

      <label>Marks (out of 100)</label>
      <input
        type="number"
        name="marks"
        value={student.marks}
        onChange={handleChange}
        min="0"
        max="100"
        required
      />

      <button type="submit">Submit Details</button>
    </form>
  );
}

export default StudentForm;
