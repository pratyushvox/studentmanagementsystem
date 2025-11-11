import React, { useState, useEffect } from "react";
import { X, Download, ExternalLink, AlertCircle, FileText, Sparkles, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

const PDFViewerModal = ({ fileUrl, submissionId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [correctedUrl, setCorrectedUrl] = useState(fileUrl);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAiResult, setShowAiResult] = useState(false);

  useEffect(() => {
    // Fix Cloudinary URLs that were uploaded with wrong resource type
    if (fileUrl && fileUrl.includes('cloudinary.com')) {
      if (fileUrl.includes('/image/upload/') && fileUrl.toLowerCase().endsWith('.pdf')) {
        const fixedUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
        console.log('🔧 Fixed Cloudinary URL:');
        console.log('❌ Old:', fileUrl);
        console.log('✅ New:', fixedUrl);
        setCorrectedUrl(fixedUrl);
      } else {
        setCorrectedUrl(fileUrl);
      }
    }
  }, [fileUrl]);

  const downloadPdf = () => {
    const downloadUrl = correctedUrl.includes('cloudinary.com') 
      ? `${correctedUrl.split('/upload/')[0]}/upload/fl_attachment/${correctedUrl.split('/upload/')[1]}`
      : correctedUrl;
    window.open(downloadUrl, '_blank');
  };

  const openInNewTab = () => {
    window.open(correctedUrl, '_blank');
  };

  const downloadFileForAnalysis = async () => {
    try {
      console.log('📥 Downloading file for analysis:', correctedUrl);
      
      // Add cache-busting parameter to avoid cached responses
      const urlWithCacheBust = `${correctedUrl}?t=${Date.now()}`;
      
      const response = await fetch(urlWithCacheBust);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      console.log('✅ File downloaded successfully, size:', blob.size, 'bytes');
      
      // Create a File object from the blob
      const file = new File([blob], `analysis-file-${submissionId || Date.now()}.pdf`, {
        type: blob.type || 'application/pdf'
      });
      
      return file;
    } catch (error) {
      console.error('❌ Failed to download file:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  };

  const analyzeWithAI = async () => {
    setAiAnalyzing(true);
    setAiResult(null);
    setShowAiResult(false);

    try {
      console.log('🤖 Starting AI analysis for:', correctedUrl);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Download the file first with better error handling
      let file;
      try {
        file = await downloadFileForAnalysis();
        console.log('📁 File ready for analysis:', file.name, file.size, 'bytes');
      } catch (downloadError) {
        throw new Error(`File download failed: ${downloadError.message}`);
      }

      // Validate file before sending
      if (!file || file.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      console.log('🚀 Sending file to AI analysis API...');
      const response = await fetch('http://localhost:5000/api/teacher/ai/analyze-assignment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - let browser set it with boundary
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `AI analysis failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ AI Analysis Result received:', data);
      setAiResult(data);
      setShowAiResult(true);

    } catch (error) {
      console.error('❌ AI Analysis Error:', error);
      setAiResult({
        success: false,
        error: error.message || 'Failed to analyze PDF with AI'
      });
      setShowAiResult(true);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const parseAIAnalysis = (analysisText) => {
    if (!analysisText) return null;

    const lines = analysisText.split('\n').filter(line => line.trim());
    const result = {
      aiScore: null,
      confidence: null,
      originality: null,
      quality: null
    };

    lines.forEach(line => {
      if (line.includes('AI Detection Score:')) {
        result.aiScore = line.split(':')[1]?.trim() || 'N/A';
      } else if (line.includes('Confidence Level:')) {
        result.confidence = line.split(':')[1]?.trim() || 'N/A';
      } else if (line.includes('Originality Assessment:')) {
        result.originality = line.split(':')[1]?.trim() || 'N/A';
      } else if (line.includes('Writing Quality Evaluation:')) {
        result.quality = line.split(':')[1]?.trim() || 'N/A';
      }
    });

    return result;
  };

  const getScoreColor = (score) => {
    if (!score || score === 'N/A') return 'text-gray-600';
    const numScore = parseInt(score);
    if (isNaN(numScore)) return 'text-gray-600';
    if (numScore >= 70) return 'text-red-600';
    if (numScore >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreBgColor = (score) => {
    if (!score || score === 'N/A') return 'bg-gray-100 border-gray-200';
    const numScore = parseInt(score);
    if (isNaN(numScore)) return 'bg-gray-100 border-gray-200';
    if (numScore >= 70) return 'bg-red-50 border-red-200';
    if (numScore >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getScoreIcon = (score) => {
    if (!score || score === 'N/A') return AlertCircle;
    const numScore = parseInt(score);
    if (isNaN(numScore)) return AlertCircle;
    if (numScore >= 70) return XCircle;
    if (numScore >= 40) return AlertCircle;
    return CheckCircle;
  };

  const getScoreText = (score) => {
    if (!score || score === 'N/A') return 'Unknown';
    const numScore = parseInt(score);
    if (isNaN(numScore)) return 'Unknown';
    if (numScore >= 70) return 'High AI Usage';
    if (numScore >= 40) return 'Moderate AI Usage';
    return 'Low AI Usage';
  };

  const isRateLimitError = (error) => {
    if (!error) return false;
    return (
      error.includes('rate limit') ||
      error.includes('rate-limited') ||
      error.includes('temporarily unavailable') ||
      error.includes('currently busy')
    );
  };

  const isWrongFormat = fileUrl.includes('/image/upload/') && fileUrl.toLowerCase().endsWith('.pdf');
  const wasFixed = isWrongFormat && correctedUrl !== fileUrl;

  const parsedResult = aiResult?.success ? parseAIAnalysis(aiResult.analysis) : null;
  const ScoreIcon = parsedResult ? getScoreIcon(parsedResult.aiScore) : AlertCircle;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-800">PDF Viewer</h2>
            {wasFixed && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                ✓ URL Auto-Fixed
              </span>
            )}
            {isWrongFormat && !wasFixed && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200">
                Wrong Format Detected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* AI Checker Button */}
            <button
              onClick={analyzeWithAI}
              disabled={aiAnalyzing}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              title="Analyze with AI"
            >
              {aiAnalyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm font-medium">Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span className="text-sm font-medium">AI Check</span>
                </>
              )}
            </button>
            
            <button
              onClick={openInNewTab}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
              title="Open in new tab"
            >
              <ExternalLink size={18} />
            </button>
            <button
              onClick={downloadPdf}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
              title="Download PDF"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 bg-gray-100 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading PDF...</p>
                {wasFixed && (
                  <p className="text-sm text-green-600 mt-2">
                    URL corrected automatically
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
              <div className="text-center p-6 max-w-md">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Cannot View PDF</h3>
                <p className="text-gray-600 mb-4">
                  {isWrongFormat 
                    ? "This PDF was uploaded with incorrect settings and cannot be viewed directly."
                    : "The PDF file cannot be displayed in the browser."
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={downloadPdf}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                  <button
                    onClick={openInNewTab}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Open in New Tab
                  </button>
                </div>
                {isWrongFormat && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
                    <p className="text-xs text-amber-800 font-medium mb-1">
                      ⚠️ Upload Configuration Issue
                    </p>
                    <p className="text-xs text-amber-700">
                      This file was uploaded with <code className="bg-amber-100 px-1 rounded">resource_type: "auto"</code> instead of <code className="bg-amber-100 px-1 rounded">"raw"</code>. 
                      Update your backend upload settings to fix this for future uploads.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <iframe
            src={correctedUrl}
            className="w-full h-full border-0"
            title="PDF Document"
            onLoad={() => {
              console.log('✅ Iframe loaded successfully');
              setLoading(false);
            }}
            onError={() => {
              console.error('❌ Iframe failed to load');
              setLoading(false);
              setError(true);
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            {wasFixed 
              ? "✓ PDF URL was automatically corrected for viewing"
              : isWrongFormat
              ? "⚠️ This file has an incorrect upload configuration"
              : "If the PDF doesn't load, try downloading it instead."
            }
          </p>
        </div>
      </div>

      {/* AI Analysis Result Popup */}
      {showAiResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-fadeIn">
            {/* Popup Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">AI Content Analysis</h3>
                    <p className="text-sm text-purple-100 mt-1">Powered by DeepSeek AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiResult(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Popup Content */}
            <div className="p-6">
              {aiResult?.success && parsedResult ? (
                <div className="space-y-4">
                  {/* AI Detection Score - Prominent Display */}
                  <div className={`p-6 rounded-xl border-2 ${getScoreBgColor(parsedResult.aiScore)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">AI Detection Score</p>
                        <p className={`text-4xl font-bold ${getScoreColor(parsedResult.aiScore)}`}>
                          {parsedResult.aiScore}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center gap-2 ${getScoreColor(parsedResult.aiScore)}`}>
                          <ScoreIcon className="w-8 h-8" />
                          <span className="text-sm font-semibold">{getScoreText(parsedResult.aiScore)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs font-medium text-blue-600 mb-1">Confidence Level</p>
                      <p className="text-lg font-bold text-blue-900">{parsedResult.confidence}</p>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-xs font-medium text-purple-600 mb-1">Originality</p>
                      <p className="text-lg font-bold text-purple-900">{parsedResult.originality}</p>
                    </div>
                    
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <p className="text-xs font-medium text-indigo-600 mb-1">Writing Quality</p>
                      <p className="text-lg font-bold text-indigo-900">{parsedResult.quality}</p>
                    </div>
                  </div>

                  {/* Full Analysis Text */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Full Analysis:</p>
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {aiResult.analysis}
                    </pre>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <span>Analyzed: {new Date(aiResult.timestamp).toLocaleString()}</span>
                    {aiResult.fileName && (
                      <span>File: {aiResult.fileName}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  {isRateLimitError(aiResult?.error) ? (
                    <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  ) : (
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  )}
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {isRateLimitError(aiResult?.error) ? 'Service Temporarily Unavailable' : 'Analysis Failed'}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {aiResult?.error || 'Unable to analyze the PDF content'}
                  </p>
                  
                  {/* Rate Limit Specific Guidance */}
                  {isRateLimitError(aiResult?.error) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-yellow-800 mb-1">What you can do:</p>
                          <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                            <li>Wait 30-60 seconds and try again</li>
                            <li>The service automatically resets quickly</li>
                            <li>Try with a shorter document for faster processing</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={analyzeWithAI}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      {isRateLimitError(aiResult?.error) ? 'Try Again' : 'Retry Analysis'}
                    </button>
                    <button
                      onClick={() => setShowAiResult(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Popup Footer */}
            {aiResult?.success && (
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    ⚠️ AI detection is an estimate and should be used as one factor in assessment
                  </p>
                  <button
                    onClick={() => setShowAiResult(false)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewerModal;