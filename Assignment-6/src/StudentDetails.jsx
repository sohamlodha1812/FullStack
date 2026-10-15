
function StudentDetails({ student }) {
  return (
    <div className="details-card">
      <h2>Student Details</h2>

      {student ? (
        <>
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Roll Number:</strong> {student.rollNumber}</p>
          <p><strong>Department:</strong> {student.department}</p>
          <p><strong>Marks:</strong> {student.marks}/100</p>
          <p><strong>Percentage:</strong> {student.marks}%</p>
        </>
      ) : (
        <p>No student details submitted yet.</p>
      )}
    </div>
  );
}

export default StudentDetails;
