// controllers/Admin/adminPostController.ts
import { createCrudControllers } from "../../utils/crudFactory";
import Post from "../../models/Post";

// Create CRUD controllers using factory
const postControllers = createCrudControllers(
  Post, 
  "Post",
  "teacherId" // Populate teacher info
);

// Export all CRUD operations
export const getAllPosts = postControllers.getAll;
export const getPostById = postControllers.getById;
export const deleteAnyPost = postControllers.delete;