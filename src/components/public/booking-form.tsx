'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitConsultationBooking } from '@/app/actions/public'
import { Loader2, CheckCircle, Calendar, Clock, User, Phone, Mail, FileText } from 'lucide-react'
import { NepaliDatePicker } from '@/components/ui/nepali-date-picker'

type Lawyer = { id: string; full_name: string; specialization: string }

export function BookingForm({ firmId, lawyers }: { firmId: string, lawyers: Lawyer[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    legalIssue: '',
    lawyerId: '',
    date: '',
    time: '10:00'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      setStep(2)
      return
    }
    
    setIsSubmitting(true)
    const res = await submitConsultationBooking({
      firmId,
      ...formData
    })
    setIsSubmitting(false)
    if (res.success) {
      setIsSuccess(true)
    } else {
      alert(res.error || 'Something went wrong')
    }
  }

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 text-green-900 p-10 rounded-3xl text-center border border-green-200 shadow-2xl shadow-green-900/5 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6 relative z-10" />
        <h3 className="text-3xl font-extrabold mb-4 tracking-tight relative z-10">Booking Confirmed!</h3>
        <p className="text-green-800/80 text-lg relative z-10">Thank you for reaching out. We have securely scheduled your consultation and will contact you shortly.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Book a Consultation</h3>
        <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-500 rounded-full">Step {step} of 2</span>
      </div>
      
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className="space-y-6"
          >
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><User className="w-4 h-4 text-blue-600"/> Full Name *</label>
                <input required type="text" className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-blue-600"/> Email</label>
                  <input type="email" className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Phone className="w-4 h-4 text-blue-600"/> Phone *</label>
                  <input required type="tel" className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+977 9800000000" />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full py-4 text-lg font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 mt-8">
              Continue to Details
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className="space-y-6"
          >
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><User className="w-4 h-4 text-indigo-600"/> Choose a Lawyer *</label>
                <select required className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all outline-none appearance-none" value={formData.lawyerId} onChange={e => setFormData({...formData, lawyerId: e.target.value})}>
                  <option value="">-- Select Expert --</option>
                  {lawyers.map(l => (
                    <option key={l.id} value={l.id}>{l.full_name} {l.specialization ? `— ${l.specialization}` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-600"/> Date *</label>
                  <NepaliDatePicker
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all outline-none"
                    value={formData.date}
                    onChange={(val) => setFormData({...formData, date: val})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600"/> Time *</label>
                  <select required className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all outline-none appearance-none" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:30">03:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600"/> Briefly describe your legal issue *</label>
                <textarea required className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all outline-none min-h-[120px] resize-none" placeholder="Please provide some context so we can prepare for the consultation..." value={formData.legalIssue} onChange={e => setFormData({...formData, legalIssue: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-4 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Back
              </button>
              <button type="submit" className="flex-1 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 flex justify-center items-center" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Booking'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
