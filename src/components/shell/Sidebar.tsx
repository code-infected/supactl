import { NavLink } from "react-router-dom";
import { useUiStore } from "../../store/uiStore";
import { useProjectsStore } from "../../store/projectsStore";

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUiStore();
  const activeProject = useProjectsStore((state) => state.getActiveProject());
  const projects = useProjectsStore((state) => state.projects);
  const hasMultipleProjects = projects.length > 1;
  
  const navItems = [
    { name: "Projects", path: "/projects", icon: "home" },
    { name: "SQL Editor", path: "/sql", icon: "terminal" },
    { name: "Tables", path: "/tables", icon: "table_chart" },
    { name: "Auth Users", path: "/auth", icon: "group" },
    { name: "Storage", path: "/storage", icon: "folder" },
    { name: "Edge Logs", path: "/logs", icon: "history" },
    { name: "Realtime", path: "/realtime", icon: "bolt" },
    { name: "RLS Policies", path: "/rls", icon: "policy" },
    { name: "Migrations", path: "/migrations", icon: "update" },
    { name: "Settings", path: "/settings/keys", icon: "settings" },
  ];

  return (
    <aside 
      className={`h-full bg-surface-low border-r border-DEFAULT flex flex-col shrink-0 transition-all duration-200 ${
        sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'
      }`}
    >
      <div className={`flex items-center gap-3 p-4 border-b border-DEFAULT ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <div 
          className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground shrink-0 relative"
          title={sidebarCollapsed && activeProject ? `${activeProject.name} (${projects.length} projects)` : undefined}
        >
          <span className="material-symbols-outlined text-[20px]">bolt</span>
          {sidebarCollapsed && activeProject && (
            <div 
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-low"
              style={{ backgroundColor: activeProject.color }}
            />
          )}
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold">Supactl</span>
            {activeProject ? (
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeProject.color }}
                />
                <span className="text-xs text-dimmer truncate" title={activeProject.name}>
                  {activeProject.name}
                </span>
                {hasMultipleProjects && (
                  <span className="text-[10px] text-zinc-600">({projects.length})</span>
                )}
              </div>
            ) : (
              <span className="text-xs text-dimmer">No project</span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              title={sidebarCollapsed ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-[12px] font-sans transition-colors cursor-pointer select-none ${
                  sidebarCollapsed ? 'justify-center px-2' : ''
                } ${
                  isActive
                    ? "text-primary bg-surface-high border-l-2 border-primary"
                    : "text-muted hover:text-white hover:bg-surface border-l-2 border-transparent"
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {!sidebarCollapsed && item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={`p-4 border-t border-DEFAULT flex flex-col gap-2 ${sidebarCollapsed ? 'items-center' : ''}`}>
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center gap-2 text-xs text-muted hover:text-white transition-colors cursor-pointer text-left"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="material-symbols-outlined text-[16px]">
            {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
          {!sidebarCollapsed && "Collapse"}
        </button>
        
        {!sidebarCollapsed && (
          <>
            <button 
              onClick={() => window.open('https://supabase.com/docs', '_blank')}
              className="flex items-center gap-2 text-xs text-muted hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              Documentation
            </button>
            <button 
              onClick={() => window.open('https://github.com/code-infected/supactl/issues', '_blank')}
              className="flex items-center gap-2 text-xs text-muted hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="material-symbols-outlined text-[16px]">help</span>
              Help & Support
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
