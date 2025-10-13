
import { Request, Response } from "express";
import { Model } from "mongoose";

export const createCrudControllers = (
  Model: Model<any>,
  modelName: string,
  populateFields?: string | string[]
) => {
  return {
    /**
     * GET ALL - Fetch all documents
     */
    getAll: async (_req: Request, res: Response) => {
      try {
        let query = Model.find();
        
        // Handle population
        if (populateFields) {
          if (Array.isArray(populateFields)) {
            populateFields.forEach(field => {
              query = query.populate(field);
            });
          } else {
            query = query.populate(populateFields);
          }
        }
        
        const items = await query;
        res.status(200).json(items);
      } catch (error: any) {
        console.error(`Error fetching ${modelName}s:`, error);
        res.status(500).json({ message: error.message });
      }
    },

    /**
     * GET BY ID - Fetch single document by ID
     */
    getById: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        let query = Model.findById(id);
        
        // Handle population
        if (populateFields) {
          if (Array.isArray(populateFields)) {
            populateFields.forEach(field => {
              query = query.populate(field);
            });
          } else {
            query = query.populate(populateFields);
          }
        }
        
        const item = await query;
        
        if (!item) {
          return res.status(404).json({ 
            message: `${modelName} not found` 
          });
        }
        
        res.status(200).json(item);
      } catch (error: any) {
        console.error(`Error fetching ${modelName}:`, error);
        res.status(500).json({ message: error.message });
      }
    },

    /**
     * DELETE - Delete document by ID
     */
    delete: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const deleted = await Model.findByIdAndDelete(id);
        
        if (!deleted) {
          return res.status(404).json({ 
            message: `${modelName} not found` 
          });
        }
        
        res.status(200).json({ 
          message: `${modelName} deleted successfully` 
        });
      } catch (error: any) {
        console.error(`Error deleting ${modelName}:`, error);
        res.status(500).json({ message: error.message });
      }
    }
  };
};