
import { useState } from "react";
import StudentForm from "./StudentForm";
import StudentDetails from "./StudentDetails";
import "./App.css";

function App() {
  const [student, setStudent] = useState(null);

  return (
    <div className="container">
      <h1>Student Information System</h1>

      <StudentForm onSubmit={setStudent} />

      <StudentDetails student={student} />
    </div>
  );
}

export default App;
