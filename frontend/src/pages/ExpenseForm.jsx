import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Loader2, 
  Coins, 
  Calendar as CalendarIcon,
  FileText,
  ScanLine
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ExpenseForm = () => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'INR',
    category: 'Travel',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [scanPreview, setScanPreview] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => setScanPreview(reader.result);
    reader.readAsDataURL(file);

    setIsScanning(true);
    setError('');

    const uploadData = new FormData();
    uploadData.append('receipt', file);

    try {
      const res = await api.post('/ocr/scan', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const { expenseForm } = res.data.data;
      
      setFormData(prev => ({
        ...prev,
        amount:      expenseForm.amount || prev.amount,
        currency:    expenseForm.currency || prev.currency,
        date:        expenseForm.date || prev.date,
        description: expenseForm.description || prev.description,
      }));
    } catch (err) {
      setError('OCR failed to read receipt. Please fill manually.');
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/expenses', formData);
      navigate('/expenses/history');
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Submit Expense</h1>
        <p className="text-gray-500 mt-2">New claim for reimbursement.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* OCR section */}
        <div className="lg:col-span-2 space-y-6">
          <div 
            onClick={() => fileInputRef.current.click()}
            className={`cursor-pointer group relative overflow-hidden rounded-3xl border-2 border-dashed transition-all aspect-[3/4] flex flex-col items-center justify-center p-8 text-center ${
              scanPreview 
                ? 'border-indigo-400 bg-indigo-50' 
                : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50'
            }`}
          >
            {scanPreview ? (
              <img src={scanPreview} alt="Receipt Preview" className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale brightness-125" />
            ) : null}

            <div className={`relative z-10 transition-transform group-hover:scale-110 duration-500 ${isScanning ? 'animate-pulse' : ''}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                scanPreview ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-primary-100 text-primary-600'
              }`}>
                {isScanning ? <ScanLine size={40} className="animate-bounce" /> : <Camera size={40} />}
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isScanning ? 'Analyzing Receipt...' : scanPreview ? 'Receipt Captured' : 'Snap a Photo'}
              </h3>
              <p className="text-sm text-gray-500 max-w-[200px] leading-relaxed">
                Upload your receipt to auto-fill the form with AI.
              </p>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleScan} 
              className="hidden" 
              accept="image/*"
            />

            {scanPreview && !isScanning && (
              <button 
                onClick={(e) => { e.stopPropagation(); setScanPreview(null); }}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="p-4 bg-primary-900 rounded-2xl text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Check size={16} className="text-primary-400" />
              </div>
              <span className="text-sm font-bold">Fast-Track Mode</span>
            </div>
            <p className="text-xs text-primary-200 leading-relaxed">
              Expenses with OCR-verified receipts are processed 2x faster by the audit team.
            </p>
          </div>
        </div>

        {/* Form section */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 px-1 flex items-center gap-2">
                  <Coins size={14} /> Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-lg"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 px-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none font-bold"
                >
                  <option>INR</option>
                  <option>USD</option>
                  <option>GBP</option>
                  <option>EUR</option>
                  <option>SGD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 px-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none font-medium"
                >
                  <option>Travel</option>
                  <option>Food</option>
                  <option>Office</option>
                  <option>Software</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 px-1 flex items-center gap-2">
                  <CalendarIcon size={14} /> Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 px-1 flex items-center gap-2">
                <FileText size={14} /> Description
              </label>
              <textarea
                required
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Merchant name, items purchased, or purpose..."
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isScanning}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-bold rounded-2xl shadow-xl shadow-primary-100 transition-all flex items-center justify-center gap-3 hover:-translate-y-0.5 active:scale-95 mt-4"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Upload size={20} />
                  <span>Submit Reimbursement</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
