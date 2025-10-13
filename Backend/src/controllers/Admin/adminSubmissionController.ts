// controllers/Admin/adminSubmissionController.ts
import { createCrudControllers } from "../../utils/crudFactory";
import Submission from "../../models/Submission";

// Create CRUD controllers using factory
const submissionControllers = createCrudControllers(
  Submission, 
  "Submission",
  ["studentId", "assignmentId"] // Populate both student and assignment
);

// Export all CRUD operations
export const getAllSubmissions = submissionControllers.getAll;
export const getSubmissionById = submissionControllers.getById;
export const deleteAnySubmission = submissionControllers.delete;