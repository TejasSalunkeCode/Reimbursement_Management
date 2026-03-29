import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, Globe, Coins, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    country: 'India',
    currency: 'INR',
    name: '',
    email: '',
    password: '',
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await signup(formData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-5 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Left Info Panel */}
        <div className="md:col-span-2 bg-slate-900 p-10 text-white flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center mb-12">
              <Building2 className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold mb-6">Create your Company Workspace.</h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              RMS Core automates your reimbursements with localized currency handling and OCR.
            </p>
          </div>

          <div className="space-y-6">
            <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${step === 1 ? 'bg-white/10 ring-1 ring-white/20' : 'opacity-50'}`}>
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center font-bold text-sm">1</div>
              <p className="font-semibold">Company Profile</p>
            </div>
            <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${step === 2 ? 'bg-white/10 ring-1 ring-white/20' : 'opacity-50'}`}>
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">2</div>
              <p className="font-semibold">Admin Account</p>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-3 p-10 lg:p-14">
          <header className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Tell us about your company' : 'Setup your Admin account'}
            </h2>
            <p className="text-gray-500">
              {step === 1 ? 'Enter the details of the organization you are managing' : 'This will be the primary account with full access'}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 italic">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {step === 1 ? (
              <div className="space-y-5 animate-slideIn">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 px-1">Legal Company Name</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g. Acme Industries Ltd."
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 px-1">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none font-medium"
                      >
                        <option>India</option>
                        <option>United States</option>
                        <option>United Kingdom</option>
                        <option>Germany</option>
                        <option>Singapore</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 px-1">Base Currency</label>
                    <div className="relative">
                      <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none font-medium"
                      >
                        <option>INR</option>
                        <option>USD</option>
                        <option>GBP</option>
                        <option>EUR</option>
                        <option>SGD</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-slideIn">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 px-1">Admin Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 px-1">Work Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@company.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 px-1">Secure Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-gray-500 font-bold hover:text-gray-900 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-bold rounded-2xl shadow-xl shadow-primary-200 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>{step === 1 ? 'Next Step' : 'Launch Workspace'}</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </form>

          <footer className="mt-12 text-center border-t pt-8">
            <p className="text-gray-500">
              Already have an workspace?{' '}
              <Link to="/login" className="font-bold text-primary-600 hover:underline">
                Sign In here
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Signup;
