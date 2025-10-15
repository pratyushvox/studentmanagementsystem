import { Request, Response } from "express";
import Notice from "../../models/Notice";


export const getStudentNotices = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      priority,
      search,
      isActive,
    } = req.query;

    const query: any = {
      targetAudience: { $in: ["student", "all"] },
    };

    // Filter by priority if provided
    if (priority) query.priority = priority;

    // Active/Inactive filter
    if (isActive !== undefined) query.isActive = isActive === "true";

    // Exclude expired notices 
    query.$or = [{ expiryDate: null }, { expiryDate: { $gte: new Date() } }];

    // Search filter
    if (search) {
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const notices = await Notice.find(query)
      .populate("postedBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Notice.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notices,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching student notices",
      error: error.message,
    });
  }
};

