import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  History, 
  Users, 
  LogOut, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SidebarItem = ({ to, icon: Icon, label, roles }) => {
  const { user } = useAuth();
  
  if (roles && !roles.includes(user?.role)) return null;

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive
            ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
            : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
        }`
      }
    >
      <Icon size={20} className="stroke-[2.5px]" />
      <span className="font-medium">{label}</span>
      <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </NavLink>
  );
};

export const Sidebar = () => {
  const { logout, user } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-screen sticky top-0 flex flex-col pt-8 pb-4">
      <div className="px-6 mb-10 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          R
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
          RMS Core
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <SidebarItem to="/expenses/new" icon={Receipt} label="Submit Expense" />
        <SidebarItem to="/expenses/history" icon={History} label="My Expenses" />
        <SidebarItem 
          to="/approvals" 
          icon={ShieldCheck} 
          label="Approvals" 
          roles={['Admin', 'Manager']} 
        />
        <SidebarItem 
          to="/admin/users" 
          icon={Users} 
          label="User Management" 
          roles={['Admin']} 
        />
      </nav>

      <div className="px-4 mt-auto">
        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
