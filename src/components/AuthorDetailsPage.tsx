import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink, 
  Check, 
  Copy, 
  GraduationCap, 
  Code, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  Laptop, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize2,
  Calendar,
  Share2
} from 'lucide-react';
import { Logo } from './Logo.tsx';

interface AuthorDetailsPageProps {
  onBackToHome: () => void;
  onNavigateToJoin: () => void;
  onNavigateToHost: () => void;
}

interface GalleryItem {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
}

const GALLERY_PHOTOS: GalleryItem[] = [
  {
    id: 'profile',
    src: '/images/author-profile.jpg',
    title: 'Official Academic Portrait',
    subtitle: 'Majid Ali (Author)',
    category: 'Leadership & Faculty',
    description: 'Executive portrait of Majid Ali, Lead Instructor and Computer Examination Architect at Access Computer Education Center, Bachhrawan.'
  },
  {
    id: 'teaching',
    src: '/images/author-teaching.jpg',
    title: 'Interactive Lecture & Lab Session',
    subtitle: 'Practical Computer Training',
    category: 'Classroom & Labs',
    description: 'Guiding candidates through hands-on programming logic, NIELIT O-Level modules, and computer fundamentals in the center\'s computer laboratory.'
  },
  {
    id: 'workstation',
    src: '/images/author-workstation.jpg',
    title: 'CBT System Architecture & Analytics',
    subtitle: 'Software Development & Platform Engineering',
    category: 'Technology & Development',
    description: 'Designing and engineering the real-time computerized assessment engine, anti-cheat surveillance, and automated PDF report generator.'
  },
  {
    id: 'mentoring',
    src: '/images/author-mentoring.jpg',
    title: 'Student Mentorship & Certification Awards',
    subtitle: 'Celebrating Student Milestones',
    category: 'Academic Achievement',
    description: 'Presenting awards and course completion credentials to students excelling in computer applications, programming, and state examinations.'
  }
];

export const AuthorDetailsPage: React.FC<AuthorDetailsPageProps> = ({
  onBackToHome,
  onNavigateToJoin,
  onNavigateToHost
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('author_profile_photo') || localStorage.getItem('arthur_profile_photo') || '/images/author-profile.jpg';
    }
    return '/images/author-profile.jpg';
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setProfilePhotoUrl(dataUrl);
          try {
            localStorage.setItem('author_profile_photo', dataUrl);
          } catch (err) {
            console.warn('Storage limit reached:', err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPhoto = () => {
    setProfilePhotoUrl('/images/author-profile.jpg');
    try {
      localStorage.removeItem('author_profile_photo');
      localStorage.removeItem('arthur_profile_photo');
    } catch {}
  };

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2200);
  };

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (activePhotoIndex === null) return;
    if (e.key === 'Escape') {
      setActivePhotoIndex(null);
    } else if (e.key === 'ArrowRight') {
      setActivePhotoIndex((prev) => (prev === null ? null : (prev + 1) % GALLERY_PHOTOS.length));
    } else if (e.key === 'ArrowLeft') {
      setActivePhotoIndex((prev) => (prev === null ? null : (prev - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length));
    }
  }, [activePhotoIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (activePhotoIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activePhotoIndex]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none animate-fade-in">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3 min-w-0">
          <button 
            type="button" 
            onClick={onBackToHome}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
            aria-label="Back to Homepage"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Logo size="md" className="shrink-0" />
          <div className="min-w-0">
            <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight tracking-tight truncate">
              Access Computer Education Center
            </h1>
            <div className="text-xs text-slate-500 font-medium leading-tight truncate mt-0.5">
              Bachhrawan, Raebareli • Faculty & Leadership Profile
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button
            type="button"
            onClick={onNavigateToHost}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:text-[#02529c] hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Host Exam</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToJoin}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#15803d] hover:bg-[#166534] text-white transition shadow-xs cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Join Test</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">
          <button 
            type="button" 
            onClick={onBackToHome}
            className="hover:text-[#02529c] transition-colors cursor-pointer font-medium"
          >
            Home
          </button>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium">Faculty & Leadership</span>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold" aria-current="page">Majid Ali (Author)</span>
        </nav>

        {/* 1. AUTHOR'S HERO PROFILE CARD */}
        <section aria-labelledby="profile-heading" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#02529c] px-6 py-6 sm:px-8 text-white flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center space-x-1.5 bg-blue-800/80 text-blue-100 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-blue-400/30">
                <Sparkles className="w-3 h-3 text-blue-200" />
                <span>Founder & Chief Instructor</span>
              </span>
              <h2 id="profile-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
                Majid Ali
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm font-medium mt-1">
                Portal Author & Lead System Architect • Computer Science Educator
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 text-xs bg-emerald-700/80 text-emerald-100 font-medium px-3 py-1 rounded-md border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Instructor</span>
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Profile Photo Card */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="relative group w-full max-w-[280px]">
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-slate-200 shadow-md bg-slate-100">
                    <img
                      src={profilePhotoUrl}
                      alt="Majid Ali (Author), Lead Instructor at Access Computer Education Center"
                      className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-102"
                      loading="eager"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                    {/* Profile image container */}

                  <div className="mt-2 text-center">
                    <div className="text-xs font-bold text-slate-900">Majid Ali (Author)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Access Computer Education Center</div>
                    <div className="text-[11px] text-[#02529c] font-semibold mt-0.5">Bachhrawan, Raebareli</div>
                  </div>
                </div>

                {/* Quick Academic Badges */}
                <div className="w-full max-w-[280px] mt-5 space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs flex items-center space-x-2.5 text-slate-700">
                    <Award className="w-4 h-4 text-[#02529c] shrink-0" />
                    <span><strong>10+ Years</strong> Computer Teaching</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs flex items-center space-x-2.5 text-slate-700">
                    <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span><strong>NIELIT O-Level</strong> Specialist</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs flex items-center space-x-2.5 text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-[#02529c] shrink-0" />
                    <span><strong>1,200+</strong> Students Mentored</span>
                  </div>
                </div>
              </div>

              {/* Biography & Vision */}
              <div className="md:col-span-8 space-y-5">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
                    Professional Background & Educational Mission
                  </h3>
                  <div className="mt-3 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    <p>
                      <strong>Majid Ali</strong> (Author & Lead Educator) is the founder, chief instructor, and software architect behind <strong>Access Computer Education Center</strong> in Bachhrawan, Raebareli.
                    </p>
                    <p>
                      With over a decade of dedicated computer science mentorship in Uttar Pradesh, Majid Ali has trained hundreds of young scholars, civil service aspirants, and technical graduates to achieve high-grade certifications in government-recognized computer qualifications, including the <strong>NIELIT O-Level Diploma (M1-R5 to M4-R5)</strong>, <strong>CCC (Course on Computer Concepts)</strong>, <strong>DCA</strong>, and modern software development.
                    </p>
                    <p>
                      Recognizing the difficulties rural and semi-urban students face during competitive computer-based government tests, Majid conceptualized and engineered this institutional <strong>Online CBT Examination Platform</strong>. The system provides real-time examination simulations with high-precision countdown timers, anti-cheat tab surveillance, auto-grading, and instant rank list generation.
                    </p>
                  </div>
                </div>

                {/* Key Teaching Highlights */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 mb-2.5">
                    Areas of Expertise & Curriculum Focus
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <Code className="w-3.5 h-3.5 text-[#02529c]" />
                        <span>Programming & Web Design</span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                        Python (M3-R5), Web Publishing (HTML5, CSS, JS), and logic development.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <Laptop className="w-3.5 h-3.5 text-emerald-700" />
                        <span>IT Tools & Office Automation</span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                        LibreOffice, MS Office Suite, Operating Systems, and digital productivity tools.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-700" />
                        <span>IoT & Emerging Technologies</span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                        Internet of Things (M4-R5), microcontrollers, and modern computing trends.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#02529c]" />
                        <span>CBT Platform Engineering</span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                        Architecting full-stack assessment engines with authoritative timer synchronization.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Educational Philosophy Quote */}
                <div className="border-l-3 border-[#02529c] pl-4 py-1.5 bg-blue-50/60 rounded-r-md">
                  <p className="text-xs italic text-blue-950 font-medium">
                    "True computer literacy is not gained by memorizing theoretical definitions, but by writing code, building practical projects at the terminal, and experiencing realistic timed assessments."
                  </p>
                  <p className="text-[11px] text-blue-800 font-bold mt-1">
                    — Majid Ali (Author)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. CONTACT INFORMATION SECTION */}
        <section aria-labelledby="contact-heading" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="max-w-2xl mb-6">
            <h3 id="contact-heading" className="text-base sm:text-lg font-bold text-slate-900">
              Get in Touch with Majid Ali
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              For student admissions, academic queries, examination scheduling, or technical collaborations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Email Address */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-blue-300 transition group">
              <div>
                <div className="w-9 h-9 rounded-md bg-blue-50 text-[#02529c] flex items-center justify-center mb-3 border border-blue-100">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</div>
                <a 
                  href="mailto:majid384ali@gmail.com" 
                  className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#02529c] break-all mt-1 inline-block transition-colors"
                >
                  majid384ali@gmail.com
                </a>
                <p className="text-[11px] text-slate-500 mt-1">Direct academic inbox</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <a
                  href="mailto:majid384ali@gmail.com"
                  className="text-xs font-semibold text-[#02529c] hover:underline inline-flex items-center space-x-1"
                >
                  <span>Send Mail</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy('majid384ali@gmail.com', 'email')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded text-xs transition cursor-pointer flex items-center space-x-1"
                  title="Copy email to clipboard"
                >
                  {copiedField === 'email' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Phone Number */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-emerald-300 transition group">
              <div>
                <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 border border-emerald-100">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phone / WhatsApp</div>
                <a 
                  href="tel:6388204105" 
                  className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 mt-1 inline-block transition-colors font-mono"
                >
                  +91 6388204105
                </a>
                <p className="text-[11px] text-slate-500 mt-1">Calls & WhatsApp inquiries</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <a
                  href="tel:6388204105"
                  className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center space-x-1"
                >
                  <span>Call Now</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy('6388204105', 'phone')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded text-xs transition cursor-pointer flex items-center space-x-1"
                  title="Copy phone number"
                >
                  {copiedField === 'phone' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Location / Address */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-amber-300 transition group">
              <div>
                <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center mb-3 border border-amber-100">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Center Location</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                  Bachhrawan, Raebareli
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Access Computer Education Center, Uttar Pradesh 229301
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <a
                  href="https://maps.google.com/?q=Bachhrawan+Raebareli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-amber-800 hover:underline inline-flex items-center space-x-1"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy('Access Computer Education Center, Bachhrawan, Raebareli', 'location')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded text-xs transition cursor-pointer flex items-center space-x-1"
                  title="Copy location address"
                >
                  {copiedField === 'location' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Social Media: Instagram */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-pink-300 transition group">
              <div>
                <div className="w-9 h-9 rounded-md bg-pink-50 text-pink-700 flex items-center justify-center mb-3 border border-pink-100">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Instagram Profile</div>
                <a 
                  href="https://www.instagram.com/lonely_soul_6388?stkn=MThqa2R5eDVqZGJ0bQ==" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm font-bold text-slate-900 hover:text-pink-700 mt-1 inline-block transition-colors break-all"
                >
                  @lonely_soul_6388
                </a>
                <p className="text-[11px] text-slate-500 mt-1">Personal & institute updates</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <a
                  href="https://www.instagram.com/lonely_soul_6388?stkn=MThqa2R5eDVqZGJ0bQ=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-pink-700 hover:underline inline-flex items-center space-x-1"
                >
                  <span>Visit Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy('https://www.instagram.com/lonely_soul_6388?stkn=MThqa2R5eDVqZGJ0bQ==', 'insta')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded text-xs transition cursor-pointer flex items-center space-x-1"
                  title="Copy Instagram link"
                >
                  {copiedField === 'insta' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 3. PHOTO GALLERY & LIGHTBOX SECTION */}
        <section aria-labelledby="gallery-heading" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 id="gallery-heading" className="text-base sm:text-lg font-bold text-slate-900">
                Author’s Activity & Academic Gallery
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Glimpses from lectures, student mentoring sessions, computer lab practicals, and software engineering.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
              Click any photo to enlarge
            </span>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GALLERY_PHOTOS.map((photo, idx) => (
              <figure
                key={photo.id}
                onClick={() => setActivePhotoIndex(idx)}
                className="group relative bg-slate-50 border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col"
              >
                <div className="aspect-4/3 w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={idx === 0 ? profilePhotoUrl : photo.src}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs text-slate-900 p-2 rounded-md shadow-md">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>
                  <span className="absolute top-2 left-2 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded">
                    {photo.category}
                  </span>
                </div>

                <figcaption className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#02529c] transition-colors leading-tight">
                      {photo.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal line-clamp-2">
                      {photo.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2 flex items-center space-x-1">
                    <span>View photo</span>
                    <span aria-hidden="true">→</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* 4. CALL TO ACTION BANNER */}
        <section aria-label="Portal Navigation Actions" className="bg-[#02529c] rounded-xl text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
              Access Computer Education Center
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold mt-1 text-white">
              Ready to Test Your Computer Knowledge?
            </h3>
            <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
              Experience the computerized examination platform designed by Majid Ali. Join a live test session with your Roll Number or create a new examination session as an examiner.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onNavigateToJoin}
              className="px-4 py-2.5 rounded-md text-xs font-bold bg-[#15803d] hover:bg-[#166534] text-white transition shadow-sm cursor-pointer flex items-center space-x-1.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Join Examination</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToHost}
              className="px-4 py-2.5 rounded-md text-xs font-bold bg-white text-[#02529c] hover:bg-blue-50 transition shadow-sm cursor-pointer flex items-center space-x-1.5"
            >
              <Laptop className="w-4 h-4" />
              <span>Host Test</span>
            </button>
          </div>
        </section>

      </main>

      {/* 5. LIGHTBOX / PHOTO MODAL */}
      {activePhotoIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Image Lightbox"
          onClick={() => setActivePhotoIndex(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-300">
                  {GALLERY_PHOTOS[activePhotoIndex].category}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-mono">
                  {activePhotoIndex + 1} of {GALLERY_PHOTOS.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Viewport */}
            <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[320px] max-h-[65vh]">
              <img
                src={activePhotoIndex === 0 ? profilePhotoUrl : GALLERY_PHOTOS[activePhotoIndex].src}
                alt={GALLERY_PHOTOS[activePhotoIndex].title}
                className="max-h-full max-w-full object-contain mx-auto"
              />

              {/* Prev Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((prev) => (prev === null ? null : (prev - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-black/60 hover:bg-black/90 text-white transition cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((prev) => (prev === null ? null : (prev + 1) % GALLERY_PHOTOS.length));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-black/60 hover:bg-black/90 text-white transition cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Footer Description */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {GALLERY_PHOTOS[activePhotoIndex].title}
                </h4>
                <span className="text-xs text-[#02529c] font-semibold">
                  {GALLERY_PHOTOS[activePhotoIndex].subtitle}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {GALLERY_PHOTOS[activePhotoIndex].description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Access Computer Education Center. Developed by Majid Ali. All rights reserved.</p>
          <div className="flex items-center space-x-3">
            <button 
              type="button"
              onClick={onBackToHome}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:text-[#02529c] hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
            >
              Home
            </button>
            <button 
              type="button"
              onClick={onNavigateToHost} 
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:text-[#02529c] hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
            >
              Host Test
            </button>
            <button 
              type="button"
              onClick={onNavigateToJoin} 
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:text-[#15803d] hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
            >
              Join Test
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
