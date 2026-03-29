import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  User, 
  Clock, 
  Eye, 
  MoreVertical,
  AlertCircle,
  Loader2,
  FileSearch,
  Zap
} from 'lucide-react';
import api from '../services/api';

const ApprovalDashboard = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [comment, setComment] = useState('');
  const [selectedApproval, setSelectedApproval] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/pending');
      setApprovals(res.data.data);
    } catch (err) {
      console.error('Failed to fetch pending approvals', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      await api.post(`/approvals/${id}/${action}`, { comments: comment });
      setComment('');
      setSelectedApproval(null);
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-primary-600" size={40} />
        <p className="text-gray-400 font-medium">Scanning for pending tasks...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5">
            <Zap size={10} fill="currentColor" /> Premium Workflow
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Approval Queue</h1>
        <p className="text-gray-500 mt-1">Review and process your team's reimbursement claims.</p>
      </header>

      {approvals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {approvals.map((app) => (
            <div key={app.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all p-8 flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black">
                    {app.expense.submittedBy.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-none mb-1">{app.expense.submittedBy.name}</h3>
                    <p className="text-xs text-gray-400 font-medium tracking-tight mb-2">Claim ID: #EXP-{app.expenseId}</p>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100 inline-flex">
                      <Clock size={10} /> Step {app.stepNumber}
                    </div>
                  </div>
                </div>
                <button className="p-2 text-gray-300 hover:text-gray-600 bg-gray-50 rounded-xl transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-8 flex-1 relative z-10">
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-black text-gray-900">{app.expense.currency}</span>
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">{app.expense.amount}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{app.expense.category}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 px-1 uppercase tracking-widest">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 px-1">
                    {app.expense.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 relative z-10 mt-auto">
                <div className="relative group">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={16} />
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={selectedApproval?.id === app.id ? comment : ''}
                    onFocus={() => { setSelectedApproval(app); setComment(''); }}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all text-sm font-medium"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAction(app.id, 'reject')}
                    disabled={processingId === app.id}
                    className="py-3.5 bg-white hover:bg-red-50 text-red-600 border border-red-100 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {processingId === app.id ? <Loader2 className="animate-spin" size={18} /> : (
                      <>
                        <XCircle size={18} /> <span>Reject</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleAction(app.id, 'approve')}
                    disabled={processingId === app.id}
                    className="py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-100 text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5"
                  >
                    {processingId === app.id ? <Loader2 className="animate-spin" size={18} /> : (
                      <>
                        <CheckCircle size={18} /> <span>Approve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-24 bg-white rounded-[48px] border-2 border-dashed border-gray-100 text-center animate-fadeIn">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle className="text-green-500" size={48} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">You're all caught up!</h3>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            No pending approvals at the moment. Good job managing the queue.
          </p>
        </div>
      )}
    </div>
  );
};

export default ApprovalDashboard;
