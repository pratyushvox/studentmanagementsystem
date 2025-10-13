// controllers/Admin/adminAssignmentController.ts
import { Request, Response } from "express";
import { createCrudControllers } from "../../utils/crudFactory";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";

// Create basic CRUD controllers using factory
const assignmentControllers = createCrudControllers(
  Assignment, 
  "Assignment",
  "teacherId" // Populate teacher info
);

// Export the basic CRUD operations
export const getAllAssignments = assignmentControllers.getAll;
export const getAssignmentById = assignmentControllers.getById;

// Custom delete function (deletes related submissions too)
export const deleteAnyAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Delete related submissions first
    await Submission.deleteMany({ assignmentId: id });
    
    // Delete assignment
    const deleted = await Assignment.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    res.status(200).json({ 
      message: "Assignment and related submissions deleted" 
    });
  } catch (error: any) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: error.message });
  }
};