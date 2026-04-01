import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const location = useLocation();

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
    <div className="w-[220px] h-full bg-surface-low border-r border-DEFAULT flex flex-col shrink-0">
      <div className="flex items-center gap-3 p-4 border-b border-DEFAULT">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
          <span className="material-symbols-outlined text-[20px]">bolt</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Supactl</span>
          <span className="text-xs text-dimmer">Local Instance</span>
        </div>
      </div>
      
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-[12px] font-sans transition-colors ${
                  isActive
                    ? "text-primary bg-surface-high border-l-2 border-primary"
                    : "text-muted hover:text-white hover:bg-surface border-l-2 border-transparent"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-DEFAULT flex flex-col gap-2">
        <a href="#" className="flex items-center gap-2 text-xs text-muted hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[16px]">menu_book</span>
          Documentation
        </a>
        <a href="#" className="flex items-center gap-2 text-xs text-muted hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[16px]">help</span>
          Help & Support
        </a>
      </div>
    </div>
  );
}
