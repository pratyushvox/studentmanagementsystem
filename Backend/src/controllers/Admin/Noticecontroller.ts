import { Request, Response } from 'express';
import Notice from '../../models/Notice'

export const createNotice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, targetAudience, priority, expiryDate, attachments } = req.body;

    if (!title || !content) {
      res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
      return;
    }

    const notice = new Notice({
      title,
      content,
      targetAudience: targetAudience || ['all'],
      priority: priority || 'medium',
      expiryDate,
      attachments: attachments || [],
      postedBy: req.user?._id
    });

    await notice.save();

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: notice
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating notice',
      error: error.message
    });
  }
};


export const getAllNotices = async (req:Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      priority, 
      isActive, 
      targetAudience,
      search 
    } = req.query;

    const query: any = {};

    if (priority) {
      query.priority = priority;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (targetAudience) {
      query.targetAudience = targetAudience;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const notices = await Notice.find(query)
      .populate('postedBy', 'name email')
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
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notices',
      error: error.message
    });
  }
};


export const getNoticeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const notice = await Notice.findById(id)
      .populate('postedBy', 'name email')
      .populate('views.userId', 'name email role');

    if (!notice) {
      res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notice',
      error: error.message
    });
  }
};

export const updateNotice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, targetAudience, priority, expiryDate, attachments, isActive } = req.body;

    const notice = await Notice.findByIdAndUpdate(
      id,
      {
        title,
        content,
        targetAudience,
        priority,
        expiryDate,
        attachments,
        isActive
      },
      { new: true, runValidators: true }
    ).populate('postedBy', 'name email');

    if (!notice) {
      res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notice updated successfully',
      data: notice
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating notice',
      error: error.message
    });
  }
};


export const deleteNotice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const notice = await Notice.findByIdAndDelete(id);

    if (!notice) {
      res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notice',
      error: error.message
    });
  }
};

