import { Request, Response } from 'express';
import { AIService } from '../../services/aiService.js';

export class AIAnalysisController {
  static async analyzeAssignment(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      console.log(`📁 Processing file: ${req.file.originalname}, Type: ${req.file.mimetype}, Size: ${req.file.size} bytes`);

      // Extract text from file
      let fileContent = '';
      
      if (req.file.mimetype === 'text/plain') {
        fileContent = req.file.buffer.toString('utf8');
        console.log(`📝 Extracted ${fileContent.length} characters from text file`);
      } else if (req.file.mimetype === 'application/pdf') {
        try {
          fileContent = await AIAnalysisController.extractTextFromPDF(req.file.buffer);
          console.log(`📄 Extracted ${fileContent.length} characters from PDF`);
        } catch (pdfError: any) {
          console.error('PDF Parsing Error:', pdfError);
          return res.status(400).json({
            success: false,
            error: `Failed to parse PDF: ${pdfError.message}`
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Only PDF and text files are supported'
        });
      }

      if (!fileContent.trim()) {
        return res.status(400).json({
          success: false,
          error: 'File appears to be empty or could not be read'
        });
      }

      // Call AI service for analysis
      console.log('🤖 Sending content to AI service for analysis...');
      const analysisResult = await AIService.analyzeContent(fileContent);
      console.log('✅ AI analysis completed successfully');

      res.json({
        success: true,
        analysis: analysisResult,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('AI Analysis Controller Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error during AI analysis'
      });
    }
  }

  private static async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      console.log('🔄 Extracting text from PDF...');
      
      // Method 1: Simple text extraction from PDF raw content
      try {
        const text = await AIAnalysisController.simplePDFTextExtraction(buffer);
        if (text && text.trim().length > 0) {
          console.log('✅ Text extracted using simple method');
          return text;
        }
      } catch (error) {
        console.log('Simple extraction failed:', error.message);
      }

      // Method 2: Try to use the PDF buffer directly as text (for some PDFs)
      try {
        // Convert buffer to string and look for readable text
        const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 100000));
        
        // Extract text between common PDF text markers
        const textMatches = bufferString.match(/(Td|Tm|Tj|TJ)[\s\S]*?\(([^)]+)\)/g) || [];
        let extractedText = '';
        
        for (const match of textMatches) {
          const textMatch = match.match(/\(([^)]+)\)/);
          if (textMatch && textMatch[1]) {
            extractedText += textMatch[1] + ' ';
          }
        }
        
        if (extractedText.trim().length > 0) {
          console.log('✅ Text extracted from PDF markers');
          return extractedText.trim();
        }
      } catch (error) {
        console.log('PDF marker extraction failed:', error.message);
      }

      // Method 3: Last resort - check if we can find any readable text
      try {
        const bufferString = buffer.toString('utf8');
        // Look for sequences of letters and spaces that might be text
        const textPattern = /[a-zA-Z]{3,}(?:\s+[a-zA-Z]{3,}){2,}/g;
        const matches = bufferString.match(textPattern);
        
        if (matches && matches.length > 0) {
          const extractedText = matches.join(' ');
          console.log('✅ Found readable text patterns in PDF');
          return extractedText;
        }
      } catch (error) {
        console.log('Pattern extraction failed:', error.message);
      }

      throw new Error('PDF appears to be image-based, scanned, or encrypted. No extractable text found.');
      
    } catch (error: any) {
      console.error('PDF Extraction Error:', error);
      throw new Error(`PDF text extraction failed: ${error.message}`);
    }
  }

  private static async simplePDFTextExtraction(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Convert buffer to string and extract text between parentheses
        // This works for many PDFs that have text content
        const bufferString = buffer.toString('latin1');
        
        // Extract text from common PDF text operators
        const textOperators = [
          /\(([^)]+)\)/g,                    // (text)
          /<([^>]+)>/g,                      // <text>
          /\/Subject\s*\(([^)]+)\)/i,        // /Subject (text)
          /\/Title\s*\(([^)]+)\)/i,          // /Title (text)
          /\/Author\s*\(([^)]+)\)/i,         // /Author (text)
        ];
        
        let extractedText = '';
        
        for (const pattern of textOperators) {
          const matches = bufferString.match(pattern);
          if (matches) {
            for (const match of matches) {
              // Clean up the extracted text
              const cleanText = match
                .replace(/[\(\)<>]/g, '')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')')
                .trim();
              
              if (cleanText.length > 3 && /[a-zA-Z]/.test(cleanText)) {
                extractedText += cleanText + ' ';
              }
            }
          }
        }
        
        if (extractedText.trim().length > 0) {
          resolve(extractedText.trim());
        } else {
          reject(new Error('No text content found'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}