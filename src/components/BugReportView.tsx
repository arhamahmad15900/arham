import React, { useState } from 'react';
import { 
  Bug, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Send, 
  FileText, 
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  ShieldAlert
} from 'lucide-react';

interface AttachmentFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeFormatted: string;
  contentType: string;
  base64Data: string;
}

interface BugReportViewProps {
  onBackToHome: () => void;
}

export const BugReportView: React.FC<BugReportViewProps> = ({ onBackToHome }) => {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Bug / Technical Error');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [fileError, setFileError] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categories = [
    'Bug / Technical Error',
    'Broken Button or Feature',
    'Login or Account Issue',
    'Test / Examination Issue',
    'PDF Upload or Question Generation Issue',
    'Host / Join Session Issue',
    'Mobile Display or Responsive Issue',
    'Performance or Loading Issue',
    'Other'
  ];

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILES = 3;
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (attachments.length + files.length > MAX_FILES) {
      setFileError(`You can attach a maximum of ${MAX_FILES} screenshots.`);
      return;
    }

    const newAttachments: AttachmentFile[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" is an unsupported format. Please select PNG, JPG, JPEG, or WEBP.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileError(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
        continue;
      }

      try {
        const base64Data = await readFileAsBase64(file);
        const previewUrl = URL.createObjectURL(file);

        newAttachments.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl,
          name: file.name,
          sizeFormatted: formatFileSize(file.size),
          contentType: file.type,
          base64Data
        });
      } catch (err) {
        setFileError(`Failed to process "${file.name}". Please try another image.`);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    // Reset file input so same file can be re-selected if needed
    e.target.value = '';
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:image/...;base64, prefix for raw base64 buffer
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => {
      const fileToRemove = prev.find(a => a.id === id);
      if (fileToRemove && fileToRemove.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(a => a.id !== id);
    });
    setFileError('');
  };

  const validateEmail = (emailStr: string): boolean => {
    if (!emailStr.trim()) return true; // optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Client-side validations
    if (!title.trim()) {
      setSubmitError('Please enter a brief Bug Title describing the problem.');
      return;
    }

    if (!description.trim()) {
      setSubmitError('Please provide a Detailed Description of the issue.');
      return;
    }

    if (email.trim() && !validateEmail(email)) {
      setSubmitError('Please enter a valid email address, or leave it blank.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        category,
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim(),
        attachments: attachments.map(a => ({
          filename: a.name,
          contentType: a.contentType,
          data: a.base64Data
        }))
      };

      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit bug report. Please try again.');
      }

      setSubmittedReportId(data.reportId || 'BUG-SUBMITTED');
    } catch (err: any) {
      setSubmitError(err.message || 'We couldn\'t send your bug report right now. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setCategory('Bug / Technical Error');
    setTitle('');
    setDescription('');
    setStepsToReproduce('');
    setAttachments([]);
    setFileError('');
    setSubmittedReportId(null);
    setSubmitError(null);
  };

  // SUCCESS SCREEN
  if (submittedReportId) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] py-8 px-4 flex flex-col items-center justify-center font-sans">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden text-center p-6 md:p-10 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-block bg-blue-100 text-[#02529c] font-mono text-xs font-extrabold px-3 py-1 rounded-full mb-3 tracking-wider">
            Report ID: {submittedReportId}
          </span>

          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
            Bug Report Submitted Successfully!
          </h2>

          <p className="text-sm md:text-base text-gray-600 mb-6 leading-relaxed max-w-lg mx-auto">
            Thank you for helping us improve <strong className="text-gray-900">Access Computer Education Center</strong>. Your report and attachments have been delivered directly to our technical support team at <span className="font-mono text-blue-900 font-bold">arhamahmad15900@gmail.com</span>.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left text-xs md:text-sm text-gray-700 mb-8 space-y-2">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500">Category:</span>
              <span className="font-bold text-gray-900">{category}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500">Title:</span>
              <span className="font-bold text-gray-900">{title}</span>
            </div>
            {attachments.length > 0 && (
              <div className="flex justify-between pt-1">
                <span className="font-semibold text-gray-500">Attached Screenshots:</span>
                <span className="font-bold text-emerald-700">{attachments.length} Image(s) Attached</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-xl transition shadow-xs flex items-center justify-center space-x-2"
            >
              <Bug className="w-4 h-4 text-blue-600" />
              <span>Report Another Bug</span>
            </button>

            <button
              onClick={onBackToHome}
              className="w-full sm:w-auto px-6 py-3 bg-[#02529c] hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Homepage</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] py-8 px-4 flex flex-col items-center font-sans select-none">
      <div className="max-w-3xl w-full">
        
        {/* Back Link Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center space-x-2 text-xs md:text-sm font-bold text-gray-600 hover:text-[#02529c] bg-white px-3.5 py-2 rounded-lg border border-gray-300 shadow-2xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Homepage</span>
          </button>

          <span className="text-xs text-gray-500 font-mono hidden sm:inline">
            Direct Support: arhamahmad15900@gmail.com
          </span>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          
          {/* Blue Header Banner */}
          <div className="bg-[#02529c] text-white p-6 md:p-8 text-center relative">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-xs">
              <Bug className="w-8 h-8 text-blue-200" />
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Report a Bug or Technical Problem
            </h1>
            <p className="text-xs md:text-sm text-blue-100 mt-2 max-w-xl mx-auto leading-relaxed">
              Encountered a broken button, exam timer issue, PDF generation error, or page bug? Fill out this form and our engineering team will investigate immediately.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            {/* Global Error Banner if submission failed */}
            {submitError && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-900 text-xs md:text-sm flex items-start space-x-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold block text-red-900 mb-0.5">Submission Error</strong>
                  <span>{submitError}</span>
                </div>
              </div>
            )}

            {/* Row 1: Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                  Your Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs md:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-hidden bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                  Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs md:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-hidden bg-gray-50/50"
                />
                <p className="text-[11px] text-gray-500 mt-1">Used only if we need to clarify details regarding your report.</p>
              </div>
            </div>

            {/* Row 2: Issue Category */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                Issue Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs md:text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-hidden bg-gray-50/50 cursor-pointer"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Bug Title */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                Bug Title / Brief Summary <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Broadcast Notice is not reaching students"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs md:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-hidden font-medium"
                required
              />
            </div>

            {/* Row 4: Detailed Description */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, what you expected to happen, and any error messages displayed on screen."
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs md:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-hidden leading-relaxed"
                required
              />
            </div>

            {/* Row 5: Steps to Reproduce */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                Steps to Reproduce <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="1. Go to Join Test&#10;2. Enter Session ID ACE-5021&#10;3. Click Submit Response button..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs md:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-hidden leading-relaxed bg-gray-50/30 font-mono text-[11px] md:text-xs"
              />
            </div>

            {/* Row 6: Screenshots / Attachment Upload */}
            <div className="pt-2 border-t border-gray-200">
              <label className="block text-xs md:text-sm font-bold text-gray-800 mb-1">
                Attach Screenshots / Photos <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload images showing the bug (PNG, JPG, JPEG, WEBP up to 5 MB each. Max 3 files).
              </p>

              {/* Upload Input Area */}
              {attachments.length < MAX_FILES && (
                <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50/80 hover:bg-blue-50/40 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs md:text-sm font-bold text-gray-700 group-hover:text-blue-700">
                    Click or drag images to upload
                  </span>
                  <span className="text-[11px] text-gray-500 mt-0.5">
                    Supports mobile camera, gallery & desktop screenshots
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}

              {/* Validation File Error Banner */}
              {fileError && (
                <p className="text-xs font-semibold text-red-600 mt-2 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fileError}</span>
                </p>
              )}

              {/* Uploaded Files Previews */}
              {attachments.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="relative bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center space-x-3 shadow-2xs group"
                    >
                      <img
                        src={att.previewUrl}
                        alt={att.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-200"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 truncate" title={att.name}>
                          {att.name}
                        </p>
                        <p className="text-[10px] text-gray-500">{att.sizeFormatted}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-gray-500">
                Will be delivered directly to <strong className="text-gray-800">arhamahmad15900@gmail.com</strong>
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-[#02529c] hover:bg-blue-800 active:scale-98 text-white font-bold text-sm md:text-base rounded-xl transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Bug Report...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Bug Report</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Support Note */}
        <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center space-x-1.5">
          <ShieldAlert className="w-4 h-4 text-blue-600" />
          <span>Access Computer Education Center • Bug Reporting System</span>
        </div>

      </div>
    </div>
  );
};
