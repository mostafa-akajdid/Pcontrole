import { 
  LayoutDashboard, 
  FolderKanban,
  FileText,
  Image,
  Users,
  Shield,
  Settings, 
  HelpCircle, 
  LogOut,
  Bell,
  ClipboardList,
  X
} from 'lucide-react';
import { useRouter } from 'next/router';
import SidebarItem from '@/components/ui/SidebarItem';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const router = useRouter();
  const { accentColor } = useAppearance();
  const { hasPermission, isAdmin, logout } = useAuth();
  
  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#f8f9fa] dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-10">
          <div 
            className="w-8 h-8 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: accentColor }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></div>
          </div>
          <span className="text-xl font-bold text-gray-800 dark:text-gray-200">Taskily</span>
          <button className="lg:hidden ml-auto" onClick={toggleSidebar} aria-label="Close sidebar">
            <X size={20}/>
          </button>
        </div>

        <div className="space-y-6 flex-1">
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-4 px-4">MENU</p>
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              href="/dashboard" 
              active={router.pathname === '/dashboard'} 
            />
            {hasPermission('projects.read') && (
              <SidebarItem 
                icon={FolderKanban} 
                label="Projects" 
                href="/dashboard/projects" 
                active={router.pathname === '/dashboard/projects'} 
              />
            )}
            {hasPermission('blogs.read') && (
              <SidebarItem 
                icon={FileText} 
                label="Blogs" 
                href="/dashboard/blogs" 
                active={router.pathname === '/dashboard/blogs'} 
              />
            )}
            {hasPermission('media.read') && (
              <SidebarItem 
                icon={Image} 
                label="Media" 
                href="/dashboard/media" 
                active={router.pathname === '/dashboard/media'} 
              />
            )}
          </div>

          {(hasPermission('users.read') || hasPermission('roles.read')) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-4 px-4">MANAGEMENT</p>
              {hasPermission('users.read') && (
                <SidebarItem 
                  icon={Users} 
                  label="Users" 
                  href="/dashboard/users" 
                  active={router.pathname === '/dashboard/users'} 
                />
              )}
              {hasPermission('roles.read') && (
                <SidebarItem 
                  icon={Shield} 
                  label="Roles" 
                  href="/dashboard/roles" 
                  active={router.pathname === '/dashboard/roles'} 
                />
              )}
            </div>
          )}

          {(hasPermission('notifications.read') || hasPermission('audit.view')) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-4 px-4">ACTIVITY</p>
              {hasPermission('notifications.read') && (
                <SidebarItem 
                  icon={Bell} 
                  label="Notifications" 
                  href="/dashboard/notifications" 
                  active={router.pathname === '/dashboard/notifications'} 
                />
              )}
              {hasPermission('audit.view') && (
                <SidebarItem 
                  icon={ClipboardList} 
                  label="Audit Log" 
                  href="/dashboard/audit" 
                  active={router.pathname === '/dashboard/audit'} 
                />
              )}
            </div>
          )}
          
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-4 px-4">GENERAL</p>
            {hasPermission('settings.read') && (
              <SidebarItem 
                icon={Settings} 
                label="Settings" 
                href="/dashboard/settings" 
                active={router.pathname === '/dashboard/settings'} 
              />
            )}
            <SidebarItem 
              icon={HelpCircle} 
              label="Help" 
              href="/dashboard/help" 
              active={router.pathname === '/dashboard/help'} 
            />
            <div onClick={() => logout()} className="cursor-pointer">
              <SidebarItem 
                icon={LogOut} 
                label="Logout" 
                href="/" 
                active={false} 
              />
            </div>
          </div>
        </div>

        <div 
          className="mt-6 relative overflow-hidden rounded-3xl p-6 text-white shadow-xl min-h-[270px]"
          style={{ 
            background: `linear-gradient(135deg, ${accentColor}dd 0%, ${accentColor} 50%, ${accentColor}cc 100%)`
          }}
        >
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,80 Q60,120 120,80 T240,80" fill="none" stroke="white" strokeWidth="1.5" />
            <path d="M0,100 Q60,140 120,100 T240,100" fill="none" stroke="white" strokeWidth="1.5" />
            <path d="M0,120 Q60,160 120,120 T240,120" fill="none" stroke="white" strokeWidth="1.5" />
            <path d="M0,140 Q60,180 120,140 T240,140" fill="none" stroke="white" strokeWidth="1.5" />
          </svg>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: accentColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h4 className="text-lg font-bold mb-1 text-white leading-tight">Download our<br/>Mobile App</h4>
            <p className="text-sm text-white/80 mb-6">Get easy in another way</p>
            
            <button className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] mt-auto backdrop-blur-sm">
              Download
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
