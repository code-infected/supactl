import { useNavigate } from "react-router-dom";
import { useProjectsStore } from "../store/projectsStore";
import { audit } from "../lib/audit";
import { log } from "../lib/logger";

export default function Projects() {
  const navigate = useNavigate();
  const { projects, activeProjectId, removeProject, setActiveProject } = useProjectsStore();

  const handleDisconnect = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      audit("PROJECT_DISCONNECT", { 
        projectUrl: project.projectUrl,
        projectRef: project.projectRef 
      }, { projectId });
      log.info("Project disconnected", { projectId, url: project.projectUrl });
    }
    
    removeProject(projectId);
    
    // If no projects left, navigate to connect
    if (projects.length <= 1) {
      navigate("/connect");
    }
  };

  const handleSwitchProject = (projectId: string) => {
    setActiveProject(projectId);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      log.info("Switched to project", { projectId, name: project.name });
    }
    navigate('/tables');
  };

  return (
    <div className="flex flex-col h-full w-full bg-background p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-sans text-white">Projects</h1>
          <p className="text-sm text-muted mt-1">Manage your connected Supabase projects</p>
        </div>
        <button 
          className="bg-surface-high hover:bg-surface-highest text-white px-4 py-2 rounded text-sm font-semibold transition-colors border border-DEFAULT flex items-center gap-2"
          onClick={() => navigate("/connect")}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Connection
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface border border-DEFAULT flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-muted text-[32px]">folder_off</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Projects Connected</h3>
          <p className="text-sm text-muted max-w-md mb-6">
            Connect your first Supabase project to start managing your database, auth, and storage.
          </p>
          <button 
            onClick={() => navigate("/connect")}
            className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded shadow-glow hover:bg-primary/90 transition-all"
          >
            Connect Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Project Cards */}
          {projects.map((project) => (
            <div 
              key={project.id}
              className={`bg-surface-low border rounded-lg p-5 flex flex-col relative overflow-hidden group ${
                project.id === activeProjectId 
                  ? 'border-primary/30' 
                  : 'border-DEFAULT hover:border-white/10'
              }`}
            >
              {/* Background glow for active project */}
              {project.id === activeProjectId && (
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"
                  style={{ backgroundColor: `${project.color}10` }}
                ></div>
              )}
              
              <div className="flex items-start justify-between mb-4 z-10">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded flex items-center justify-center shadow-sm"
                    style={{ 
                      backgroundColor: `${project.color}20`,
                      borderColor: `${project.color}40`,
                      border: '1px solid'
                    }}
                  >
                    <span 
                      className="material-symbols-outlined text-[20px]"
                      style={{ color: project.color }}
                    >
                      database
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base">{project.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ 
                          backgroundColor: project.color,
                          boxShadow: `0 0 8px ${project.color}66`
                        }}
                      ></div>
                      <span 
                        className="text-xs tracking-wide"
                        style={{ color: project.color }}
                      >
                        {project.id === activeProjectId ? 'Active' : 'Connected'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Color indicator dot */}
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                ></div>
              </div>

              <div className="flex flex-col gap-2 mb-6 z-10">
                <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded border border-DEFAULT">
                  <span className="material-symbols-outlined text-[14px] text-muted">link</span>
                  <span className="text-xs font-mono text-muted truncate">{project.projectUrl}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1">
                  <span className="material-symbols-outlined text-[12px] text-dimmer">schedule</span>
                  <span className="text-[10px] text-dimmer">
                    Last connected: {new Date(project.lastConnectedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2 z-10 pt-4 border-t border-DEFAULT">
                {project.id === activeProjectId ? (
                  <>
                    <button 
                      onClick={() => navigate('/tables')}
                      className="flex-1 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded text-sm hover:bg-primary/90 transition-colors shadow-glow text-center"
                    >
                      Open Dashboard
                    </button>
                    <button 
                      onClick={() => handleDisconnect(project.id)}
                      className="px-3 py-2 rounded bg-surface border border-DEFAULT text-muted hover:text-error hover:border-error/30 hover:bg-error/10 transition-colors"
                      title="Remove Project"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleSwitchProject(project.id)}
                      className="flex-1 bg-surface-high text-white font-semibold px-4 py-2 rounded text-sm hover:bg-surface-highest transition-colors border border-DEFAULT text-center"
                    >
                      Switch to Project
                    </button>
                    <button 
                      onClick={() => handleDisconnect(project.id)}
                      className="px-3 py-2 rounded bg-surface border border-DEFAULT text-muted hover:text-error hover:border-error/30 hover:bg-error/10 transition-colors"
                      title="Remove Project"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Add New Project Card */}
          <button
            onClick={() => navigate("/connect")}
            className="bg-surface-low border border-dashed border-DEFAULT rounded-lg p-5 flex flex-col items-center justify-center text-center hover:border-primary/30 hover:bg-surface-high/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-surface border border-DEFAULT flex items-center justify-center mb-3 group-hover:border-primary/30 transition-colors">
              <span className="material-symbols-outlined text-muted text-[24px] group-hover:text-primary transition-colors">add</span>
            </div>
            <h4 className="text-white font-medium text-sm">Add Project</h4>
            <p className="text-xs text-muted mt-1">Connect another Supabase project</p>
          </button>
        </div>
      )}
    </div>
  );
}
