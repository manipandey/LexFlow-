'use client'

import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Globe, Users, Briefcase, ChevronRight, Star } from 'lucide-react'
import { BookingForm } from './booking-form'

export function FirmHero({ firm }: { firm: any }) {
  return (
    <div className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden bg-slate-900 text-white flex items-center min-h-[70vh]">
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.3 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={firm.hero_image_url || "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2000&auto=format&fit=crop"} 
          alt="Law Firm Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
      </motion.div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 text-center md:text-left">
          {firm.logo_url && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img src={firm.logo_url} alt="Logo" className="w-32 h-32 md:w-40 md:h-40 rounded-3xl shadow-2xl shadow-black/50 border border-white/20 bg-white/5 backdrop-blur-sm object-cover" />
            </motion.div>
          )}
          
          <div className="flex-1">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 font-medium text-sm mb-6"
            >
              <Star className="w-4 h-4 fill-blue-400" /> Premium Legal Services
            </motion.div>
            
            <motion.h1 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
            >
              {firm.name}
            </motion.h1>
            
            {firm.tagline && (
              <motion.p 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-xl md:text-2xl text-slate-300 font-medium max-w-3xl leading-relaxed"
              >
                {firm.tagline}
              </motion.p>
            )}

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-10 flex flex-wrap justify-center md:justify-start gap-4"
            >
              <a href="#book" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-full shadow-xl shadow-blue-900/50 transition-all hover:-translate-y-1">
                Book Consultation <ChevronRight className="ml-2 w-5 h-5" />
              </a>
              <a href="#expertise" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all">
                Meet the Team
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FirmContent({ firm, lawyers }: { firm: any, lawyers: any[] }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 -mt-20 relative z-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT COLUMN: ABOUT & TEAM */}
        <div className="lg:col-span-7 space-y-16">
          
          <motion.section
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-2xl">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              About Our Firm
            </h2>
            <div className="prose prose-lg text-slate-600 leading-relaxed max-w-none">
              {firm.description ? (
                <p className="whitespace-pre-line text-lg">{firm.description}</p>
              ) : (
                <p>Welcome to {firm.name}. We are dedicated to providing excellent legal services to our clients.</p>
              )}
            </div>
          </motion.section>

          <motion.section
            id="expertise"
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-2xl">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              Our Legal Experts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {lawyers.map((lawyer, i) => (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  key={lawyer.id} 
                  className="group bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-200/50 border border-slate-100 transition-all hover:-translate-y-1 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={lawyer.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(lawyer.full_name) + "&background=random"} 
                      alt={lawyer.full_name} 
                      className="w-16 h-16 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{lawyer.full_name}</h4>
                      <p className="text-sm font-semibold text-indigo-600 mb-1">{lawyer.role.replace('_', ' ').toUpperCase()}</p>
                    </div>
                  </div>
                  {lawyer.specialization && (
                    <div className="pt-4 border-t border-slate-50">
                      <p className="text-sm text-slate-500 line-clamp-2">{lawyer.specialization}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>

        </div>

        {/* RIGHT COLUMN: BOOKING & CONTACT */}
        <div className="lg:col-span-5 space-y-8" id="book">
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="sticky top-28"
          >
            <BookingForm firmId={firm.id} lawyers={lawyers} />

            <div className="mt-8 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <h3 className="font-bold text-xl text-slate-900 mb-6">Contact Information</h3>
              <ul className="space-y-5 text-slate-600">
                {firm.phone && (
                  <li className="flex items-center gap-4 group">
                    <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-900">{firm.phone}</span>
                  </li>
                )}
                {firm.email && (
                  <li className="flex items-center gap-4 group">
                    <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-900">{firm.email}</span>
                  </li>
                )}
                {firm.website && (
                  <li className="flex items-center gap-4 group">
                    <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Globe className="w-5 h-5" />
                    </div>
                    <a href={firm.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">{firm.website}</a>
                  </li>
                )}
                {(firm.address || firm.city) && (
                  <li className="flex items-start gap-4 group">
                    <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mt-1">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-900 leading-relaxed">{firm.address}<br/><span className="text-slate-500">{firm.city}</span></span>
                  </li>
                )}
              </ul>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
