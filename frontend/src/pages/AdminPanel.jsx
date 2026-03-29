import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  Shield, 
  Mail, 
  Trash2, 
  Edit2, 
  UserCheck, 
  Loader2,
  AlertTriangle,
  Settings2
} from 'lucide-react';
import api from '../services/api';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/users', formData);
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'Employee' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workspace Control</h1>
          <p className="text-gray-500 mt-1">Manage users, roles, and administrative configurations.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2"
        >
          <UserPlus size={20} />
          <span>Add Member</span>
        </button>
      </header>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sort by:</span>
            <select className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none">
              <option>Newest First</option>
              <option>Role (Admin)</option>
              <option>Alphabetical</option>
            </select>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <th className="px-6 py-4">Identity</th>
                <th className="px-6 py-4">Authorization</th>
                <th className="px-6 py-4">Manager</th>
                <th className="px-6 py-4 text-center">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-black text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-0.5">{user.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium tracking-tight">
                          <Mail size={12} /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                      user.role === 'Admin' ? 'bg-indigo-600 text-white border-indigo-700' :
                      user.role === 'Manager' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {user.role === 'Admin' && <Shield size={10} fill="currentColor" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                      {user.manager ? (
                        <>
                          <UserCheck size={16} className="text-green-500" />
                          <span>{user.manager.name}</span>
                        </>
                      ) : (
                        <p className="text-[10px] font-black text-gray-300 uppercase italic">Head of Department</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2.5 text-gray-400 hover:bg-white hover:text-primary-600 rounded-xl border border-transparent hover:border-gray-100 shadow-sm transition-all focus:scale-90">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2.5 text-gray-400 hover:bg-white hover:text-red-600 rounded-xl border border-transparent hover:border-gray-100 shadow-sm transition-all focus:scale-90">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-white/20 p-10 animate-scaleUp">
            <header className="mb-10 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Onboard Member</h3>
                <p className="text-gray-500 text-sm font-medium mt-1">Assign roles and workspace credentials.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-3 bg-gray-50 border border-gray-100 text-gray-400 hover:text-gray-900 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 px-1 uppercase tracking-widest">Display Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold"
                  placeholder="e.g. Robert Fox"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 px-1 uppercase tracking-widest">Account Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold"
                  placeholder="robert@company.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 px-1 uppercase tracking-widest">Initial Pwd</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 px-1 uppercase tracking-widest">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold appearance-none"
                  >
                    <option>Employee</option>
                    <option>Manager</option>
                    <option>Admin</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600 flex-1 flex items-center gap-3">
                  <AlertTriangle size={20} className="shrink-0" />
                  <p className="text-[10px] font-bold leading-tight uppercase tracking-tight">
                    Onboarded users should change their password upon first login.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
