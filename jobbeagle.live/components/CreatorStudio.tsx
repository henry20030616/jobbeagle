import React, { useState } from 'react';
import { generateJobScriptAndImage, generateRecruitmentVideo } from '../services/geminiService';
import { GeneratedContent, JobData } from '../types';
import { Loader2, Clapperboard, Video, Sparkles, Check, Play, Upload, Film, FileVideo } from 'lucide-react';

interface CreatorStudioProps {
  onJobCreated: (job: JobData) => void;
}

const CreatorStudio: React.FC<CreatorStudioProps> = ({ onJobCreated }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'upload'>('ai');
  const [step, setStep] = useState<'input' | 'generating_script' | 'preview_script' | 'generating_video' | 'final_preview'>('input');
  
  // Form Data
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    description: ''
  });

  // Generated Content State
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  
  // Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);

  // --- AI Flow Handlers ---

  const checkApiKey = async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Assume success or user re-tries
      }
    }
  };

  const handleGenerateScript = async () => {
    if (!formData.companyName || !formData.jobTitle) return;
    
    setStep('generating_script');
    try {
      const content = await generateJobScriptAndImage(
        formData.companyName,
        formData.jobTitle,
        formData.description
      );
      setGeneratedContent(content);
      setStep('preview_script');
    } catch (error) {
      console.error(error);
      alert("Script generation failed. Please try again.");
      setStep('input');
    }
  };

  const handleGenerateVideo = async () => {
    if (!generatedContent) return;
    
    await checkApiKey(); // Ensure key is selected for Veo

    setStep('generating_video');
    try {
        const videoUri = await generateRecruitmentVideo(generatedContent.visualDescription);
        setGeneratedContent({
            ...generatedContent,
            videoUri
        });
        setStep('final_preview');
    } catch (error) {
        console.error(error);
        alert("Video generation failed. Please check your API key quotas.");
        setStep('preview_script');
    }
  };

  const handlePublishAI = () => {
    if (!generatedContent) return;
    
    // For Veo videos, we need to append the API key to view them
    const finalVideoUrl = generatedContent.videoUri 
        ? `${generatedContent.videoUri}&key=${process.env.API_KEY}`
        : undefined;

    const newJob: JobData = {
        id: `gen-${Date.now()}`,
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
        location: 'Remote / AI Generated',
        salary: 'Competitive',
        description: generatedContent.script,
        tags: ['AI Generated', 'Veo'],
        logoUrl: generatedContent.thumbnailBase64 
            ? `data:image/png;base64,${generatedContent.thumbnailBase64}` 
            : undefined,
        videoUrl: finalVideoUrl,
        isAiGenerated: true
    };
    
    onJobCreated(newJob);
  };

  // --- Upload Flow Handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setUploadedFile(file);
        setUploadPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePublishUpload = () => {
      if (!uploadedFile || !uploadPreviewUrl) return;

      const newJob: JobData = {
        id: `upload-${Date.now()}`,
        companyName: formData.companyName || "My Company",
        jobTitle: formData.jobTitle || "Hiring Now",
        location: 'Uploaded Job',
        salary: 'Open',
        description: formData.description || "Check out this video job description!",
        tags: ['Uploaded', 'Video'],
        videoUrl: uploadPreviewUrl, // Blob URL
        isAiGenerated: false
    };

    onJobCreated(newJob);
  };

  return (
    <div className="h-full w-full bg-slate-950 text-white flex flex-col overflow-y-auto pb-20">
      
      {/* Header */}
      <div className="p-6 pt-10 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10 border-b border-white/10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="text-purple-400" /> AI Creator Studio
        </h1>
        
        {/* Tabs */}
        <div className="flex gap-4 mt-6">
            <button 
                onClick={() => setActiveTab('ai')}
                className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'ai' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                AI Generation (Veo)
            </button>
            <button 
                onClick={() => setActiveTab('upload')}
                className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'upload' ? 'border-cyan-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                Upload Video
            </button>
        </div>
      </div>

      <div className="p-6 flex-1">
        
        {/* --- AI GENERATION FLOW --- */}
        {activeTab === 'ai' && (
            <>
                {step === 'input' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                            placeholder="e.g. Acme Corp"
                            value={formData.companyName}
                            onChange={e => setFormData({...formData, companyName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                            placeholder="e.g. Senior Product Manager"
                            value={formData.jobTitle}
                            onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Key Highlights</label>
                        <textarea 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500 outline-none h-32 resize-none transition-all"
                            placeholder="List key requirements or benefits..."
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <button 
                        onClick={handleGenerateScript}
                        disabled={!formData.companyName || !formData.jobTitle}
                        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                        <Sparkles size={20} /> Generate Script & Plan
                    </button>
                </div>
                )}

                {(step === 'generating_script' || step === 'generating_video') && (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 py-20 animate-in fade-in duration-700">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                            <Loader2 size={64} className="text-purple-400 animate-spin relative z-10" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold">
                                {step === 'generating_script' ? 'Writing Script...' : 'Generating Video with Veo...'}
                            </h3>
                            <p className="text-gray-400">
                                {step === 'generating_script' ? 'Creating engaging content with Gemini 3 Pro' : 'This may take up to a minute. Please wait...'}
                            </p>
                        </div>
                    </div>
                )}

                {step === 'preview_script' && generatedContent && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                <Clapperboard size={18} /> Script Preview
                            </h3>
                            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                                {generatedContent.script}
                            </div>
                        </div>

                        {generatedContent.thumbnailBase64 && (
                             <div className="relative w-full h-48 rounded-xl overflow-hidden">
                                <img 
                                    src={`data:image/png;base64,${generatedContent.thumbnailBase64}`} 
                                    className="w-full h-full object-cover opacity-60" 
                                    alt="Thumbnail"
                                />
                                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs">Visual Style Preview</div>
                             </div>
                        )}

                        <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg text-sm text-yellow-200">
                            <strong>Note:</strong> Generating video uses the <strong>Veo</strong> model and requires a paid project API Key.
                        </div>

                        <button 
                            onClick={handleGenerateVideo}
                            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                        >
                            <Video size={20} /> Generate Video (Veo)
                        </button>
                    </div>
                )}

                {step === 'final_preview' && generatedContent && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Final Video Preview */}
                        <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl border border-gray-800">
                            {generatedContent.videoUri ? (
                                <video 
                                    src={`${generatedContent.videoUri}&key=${process.env.API_KEY}`}
                                    className="w-full h-full object-cover"
                                    controls
                                    autoPlay
                                    loop
                                    playsInline
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-red-400">Video load failed</div>
                            )}
                        </div>

                        <button 
                            onClick={handlePublishAI}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                        >
                            <Check size={20} /> Publish Job Video
                        </button>
                    </div>
                )}
            </>
        )}

        {/* --- UPLOAD FLOW --- */}
        {activeTab === 'upload' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-cyan-500 transition-colors cursor-pointer relative bg-slate-900/50">
                    <input 
                        type="file" 
                        accept="video/*" 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload size={48} className="text-gray-400" />
                    <div className="text-center">
                        <p className="text-lg font-medium text-white">Tap to Upload Video</p>
                        <p className="text-sm text-gray-500">MP4, WebM (Max 50MB)</p>
                    </div>
                </div>

                {uploadPreviewUrl && (
                    <div className="w-full aspect-[9/16] bg-black rounded-xl overflow-hidden border border-slate-700 relative group">
                        <video 
                            src={uploadPreviewUrl} 
                            className="w-full h-full object-cover" 
                            controls 
                        />
                        <button 
                            onClick={() => {
                                setUploadedFile(null);
                                setUploadPreviewUrl(null);
                            }}
                            className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white hover:bg-red-600 transition-colors"
                        >
                            x
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                     <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="Company Name"
                            value={formData.companyName}
                            onChange={e => setFormData({...formData, companyName: e.target.value})}
                        />
                         <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="Job Title"
                            value={formData.jobTitle}
                            onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                        />
                </div>

                <button 
                    onClick={handlePublishUpload}
                    disabled={!uploadedFile || !formData.companyName}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                    <Check size={20} /> Publish Uploaded Job
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default CreatorStudio;