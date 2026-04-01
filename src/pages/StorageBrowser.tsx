import { useState, useEffect } from "react";
import { useProjectStore } from "../store/projectStore";
import { createSupabaseClient } from "../lib/supabase";
import { ResizablePanel } from "../components/ResizablePanel";

interface Bucket {
  id: string;
  name: string;
  public: boolean;
  created_at: string;
  updated_at: string;
}

interface FileObject {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
    cacheControl: string;
  };
}

export default function StorageBrowser() {
  const { projectUrl, serviceKey } = useProjectStore();
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [files, setFiles] = useState<FileObject[]>([]);
  const [activeBucket, setActiveBucket] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    async function fetchBuckets() {
      if (!projectUrl || !serviceKey) {
        setBuckets([]);
        setActiveBucket(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseClient(projectUrl, serviceKey);
        const { data, error: fetchError } = await supabase.storage.listBuckets();
        if (fetchError) throw fetchError;
        if (data && data.length > 0) {
          setBuckets(data as Bucket[]);
          setActiveBucket(data[0].id);
        } else {
          setBuckets([]);
          setActiveBucket(null);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to fetch buckets');
        setBuckets([]);
        setActiveBucket(null);
      } finally {
        setLoading(false);
      }
    }
    fetchBuckets();
  }, [projectUrl, serviceKey]);

  useEffect(() => {
    async function fetchFiles() {
      if (!activeBucket || !projectUrl || !serviceKey) {
        setFiles([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseClient(projectUrl, serviceKey);
        const { data, error: fetchError } = await supabase.storage.from(activeBucket).list();
        if (fetchError) throw fetchError;
        if (data) {
          setFiles(data as any[]);
          setSelectedFile(null);
        } else {
          setFiles([]);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to fetch files');
        setFiles([]);
        setSelectedFile(null);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [activeBucket, projectUrl, serviceKey]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background font-sans">
      
      {/* 1. Left Buckets Panel */}
      <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400} className="bg-surface-container-lowest flex flex-col border-r border-white/5">
        <div className="p-4 border-b border-white/5 shrink-0 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono">Storage</span>
          <button className="text-zinc-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[16px]">more_vert</span>
          </button>
        </div>
        <div className="p-4 shrink-0">
          <button className="w-full bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-glow">
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Bucket
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto w-full py-2 space-y-1">
          {!projectUrl || !serviceKey ? (
            <div className="p-4 text-zinc-500 text-xs text-center">
              <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">folder</span>
              Connect to a project to see storage buckets.
            </div>
          ) : buckets.length === 0 ? (
            <div className="p-4 text-zinc-500 text-xs text-center">
              <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">folder_open</span>
              No buckets found. Create one to get started.
            </div>
          ) : buckets.map(bucket => {
            const isActive = bucket.id === activeBucket;
            return (
              <div 
                key={bucket.id}
                onClick={() => setActiveBucket(bucket.id)}
                className={`px-4 py-2 cursor-pointer transition-colors group ${
                  isActive 
                    ? "bg-primary/5 border-l-2 border-primary" 
                    : "hover:bg-surface-container border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-primary shadow-glow" : "text-zinc-500"}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>folder</span>
                    <span className={`text-sm truncate ${isActive ? "text-white font-medium" : "text-zinc-300 group-hover:text-white"}`}>
                      {bucket.name}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${bucket.public ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-400"}`}>
                    {bucket.public ? "PUBLIC" : "PRIVATE"}
                  </span>
                </div>
              </div>
            );
          })}
        </nav>
      </ResizablePanel>

      {/* 2. Main File Grid */}
      <section className="flex-1 bg-surface-container flex flex-col overflow-hidden">
        {/* Toolbar */}
        <header className="h-14 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-[#131313]">
          <div className="flex items-center gap-2 text-sm font-mono text-zinc-400">
            <span className="material-symbols-outlined text-[16px] text-zinc-500">home</span>
            <span className="text-[#5c5b5b]">/</span>
            <span className="text-white">{activeBucket}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#0e0e0e] rounded-lg border border-white/5 p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded flex items-center justify-center transition-colors ${viewMode === 'grid' ? "bg-surface-container-high text-white" : "text-zinc-500 hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1 rounded flex items-center justify-center transition-colors ${viewMode === 'list' ? "bg-surface-container-high text-white" : "text-zinc-500 hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-[16px]">view_list</span>
              </button>
            </div>
            <div className="h-4 w-[1px] bg-white/5"></div>
            <button className="border border-white/10 hover:border-white/20 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <span className="material-symbols-outlined text-[14px]">create_new_folder</span>
              New Folder
            </button>
            <button className="bg-primary text-background px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all shadow-glow">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>upload</span>
              Upload Files
            </button>
          </div>
        </header>

        {/* File Grid Area */}
        <div className="flex-1 overflow-auto scrollbar-hide bg-[#141414] p-6">
          {loading ? (
             <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-sm">Loading bucket...</div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <span className="material-symbols-outlined text-4xl opacity-50 mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
              <p className="text-white font-medium mb-1">Bucket is empty</p>
              <p className="text-sm">Upload files or create a directory to get started.</p>
              <button className="mt-4 bg-primary text-background px-4 py-2 rounded-lg text-sm font-bold shadow-glow hover:brightness-110 transition-colors">
                Upload Files
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <div 
                  key={file.name} 
                  onClick={() => setSelectedFile(file)}
                  className={`bg-surface-container border rounded-lg overflow-hidden cursor-pointer group transition-all ${
                    selectedFile?.name === file.name 
                      ? "border-primary ring-1 ring-primary/20 shadow-glow" 
                      : "border-white/5 hover:border-white/20 hover:bg-surface-container-high"
                  }`}
                >
                  <div className="aspect-video bg-[#0e0e0e] border-b border-white/5 relative flex items-center justify-center overflow-hidden">
                    <span className="material-symbols-outlined text-4xl text-zinc-700 group-hover:text-zinc-500 transition-colors">
                      {file.metadata?.mimetype?.includes('image') ? 'image' : 'draft'}
                    </span>
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black/50" onClick={e => e.stopPropagation()} />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-6 h-6 rounded bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors" onClick={e => e.stopPropagation()}>
                        <span className="material-symbols-outlined text-[16px]">more_vert</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-slate-200 truncate mb-1">{file.name}</h4>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span>{formatSize(file.metadata?.size || 0)}</span>
                      <span>{new Date(file.updated_at || file.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container rounded-lg border border-white/5 border-collapse">
               {/* List view mockup */}
               <table className="w-full text-left border-collapse text-sm">
                 <thead className="text-[#5c5b5b] font-mono text-[10px] uppercase tracking-widest border-b border-white/5 bg-[#131313]">
                   <tr>
                     <th className="px-4 py-3 font-medium">Name</th>
                     <th className="px-4 py-3 font-medium">Size</th>
                     <th className="px-4 py-3 font-medium">Type</th>
                     <th className="px-4 py-3 font-medium">Last Modified</th>
                     <th className="w-10"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {files.map(file => (
                     <tr key={file.name} onClick={() => setSelectedFile(file)} className={`cursor-pointer hover:bg-surface-container-highest transition-colors ${selectedFile?.name === file.name ? 'bg-primary/5' : ''}`}>
                       <td className="px-4 py-3 flex items-center gap-3">
                         <span className="material-symbols-outlined text-zinc-500 text-[18px]">
                           {file.metadata?.mimetype?.includes('image') ? 'image' : 'draft'}
                         </span>
                         <span className="text-slate-200">{file.name}</span>
                       </td>
                       <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{formatSize(file.metadata?.size || 0)}</td>
                       <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{file.metadata?.mimetype || 'Unknown'}</td>
                       <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{new Date(file.updated_at || file.created_at).toLocaleDateString()}</td>
                       <td className="px-4 py-3 text-right">
                         <button className="text-zinc-500 hover:text-white transition-colors" onClick={e => e.stopPropagation()}>
                           <span className="material-symbols-outlined text-[18px]">more_vert</span>
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          )}
        </div>
      </section>

      {/* 3. Right Detail Panel */}
      <aside className="w-[300px] bg-background flex flex-col shrink-0 border-l border-white/5">
        <div className="h-14 px-4 flex items-center border-b border-white/5 shrink-0 bg-[#131313]">
          <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono">File Details</span>
        </div>
        
        {selectedFile ? (
          <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-5 space-y-6">
            <div className="aspect-square bg-surface-container rounded-lg border border-white/5 flex flex-col items-center justify-center p-4">
               <span className="material-symbols-outlined text-6xl text-zinc-700 mb-4">
                 {selectedFile.metadata?.mimetype?.includes('image') ? 'image' : 'draft'}
               </span>
               <span className="text-xs text-zinc-500 font-mono break-all text-center">{selectedFile.name}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block mb-1">Name</label>
                <div className="text-sm text-slate-200 break-all">{selectedFile.name}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block mb-1">Size</label>
                  <div className="text-sm text-slate-200 font-mono">{formatSize(selectedFile.metadata?.size || 0)}</div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block mb-1">Type</label>
                  <div className="text-sm text-slate-200 font-mono truncate">{selectedFile.metadata?.mimetype || 'unknown'}</div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block mb-1">Last Modified</label>
                <div className="text-sm text-slate-200 font-mono">{new Date(selectedFile.updated_at || selectedFile.created_at).toLocaleString()}</div>
              </div>
            </div>

            <hr className="border-white/5" />

            <div className="space-y-3">
               <div className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono">Public URL</div>
               <div className="bg-[#131313] border border-white/10 rounded-lg p-3 relative group">
                 <div className="text-xs font-mono text-slate-400 break-all pr-8">
                   {projectUrl ? `${projectUrl}/storage/v1/object/public/${activeBucket}/${selectedFile.name}` : `https://xyz.supabase.co/storage/v1/object/public/.../${selectedFile.name}`}
                 </div>
                 <button className="absolute top-2 right-2 text-primary hover:text-white transition-colors bg-[#131313] rounded pl-2">
                   <span className="material-symbols-outlined text-[16px]">content_copy</span>
                 </button>
               </div>
            </div>
            
            <div className="space-y-2 pt-4">
              <button className="w-full h-9 rounded-lg border border-white/10 hover:border-white/20 bg-surface-container-lowest text-xs font-medium text-slate-300 flex items-center justify-center gap-2 transition-colors">
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download
              </button>
              <button className="w-full h-9 rounded-lg border border-error/20 hover:bg-error/10 text-xs font-medium text-error flex items-center justify-center gap-2 transition-colors">
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Delete File
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <span className="material-symbols-outlined text-4xl opacity-30 mb-2">info</span>
            <span className="text-xs font-mono">Select a file to view details</span>
          </div>
        )}
      </aside>
    </div>
  );
}
