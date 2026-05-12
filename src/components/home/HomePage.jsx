import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Footer from '../layout/Footer';
import FeatureCard from './FeatureCard';
import TestimonialCard from './TestimonialCard';
import Toast from '../Toast';

const HomePage = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const checkLogin = () => {
      const savedUser = localStorage.getItem('currentUser');
      setIsLoggedIn(!!savedUser);
    };
    checkLogin();
    window.addEventListener('focus', checkLogin);
    window.addEventListener('storage', checkLogin);
    return () => {
      window.removeEventListener('focus', checkLogin);
      window.removeEventListener('storage', checkLogin);
    };
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) { setToast({ message: 'You are already logged in! Please logout first to create a new account.', type: 'info' }); }
    else { navigate('/signup'); }
  };

  const features = [
    { icon: '🚀', title: 'Write a Full Thesis in Minutes', description: 'From introduction to conclusion — we guide you chapter by chapter with properly structured academic content tailored to your field.' },
    { icon: '📚', title: 'Citations That Impress', description: 'Real references from Crossref, auto-formatted in APA, MLA, Harvard & more. Your supervisor will love the bibliography.' },
    { icon: '✨', title: 'Sound Like Yourself', description: 'One click to humanise AI text into your natural academic voice. No robotic phrases, no awkward wording.' },
    { icon: '📄', title: 'Export-Ready, One Click Away', description: 'Professional .docx, .pdf, .tex & .md files — complete with title page, table of contents, figures, and references.' },
    { icon: '🔍', title: 'Your Research Command Center', description: 'Search literature, upload papers, verify citations, and build a source library — all in one place.' },
    { icon: '🎯', title: 'Graduate on Time', description: 'Progress tracking, smart outlines, structured workflow — we keep you moving so you cross that finish line.' },
  ];

  const testimonials = [
    { name: 'Dr. Kwame Asare', role: 'PhD Graduate, KNUST', content: 'PAGYS took my thesis from scattered notes to a defendable draft in two weeks. The chapter structure feature alone saved me a whole semester.' },
    { name: 'Grace Osei', role: 'MPhil Student, University of Ghana', content: 'I was stuck on my literature review for months. With PAGYS, I finished Chapter 2 in one weekend. The auto-citations are a lifesaver.' },
    { name: 'Samuel Adeyemi', role: 'MSc Candidate, University of Lagos', content: 'My supervisor kept rejecting my drafts until I used PAGYS. The academic tone and proper referencing finally got me a green light.' },
    { name: 'Ama Serwaa Bonsu', role: 'PhD Candidate, UPSA', content: 'Balancing work and thesis was impossible until I found this. The guided writing kept me on track and I submitted on time.' },
    { name: 'Chidiebere Obi', role: 'Master\'s Student, University of Ibadan', content: 'Writing methodology chapter was a nightmare. PAGYS generated a solid quantitative framework that needed only minor tweaks.' },
    { name: 'Nana Yaa Asantewaa', role: 'Final Year, Pentecost University', content: 'The humanise feature is pure gold. It turned robotic AI text into something that actually sounds like me.' },
    { name: 'Emeka Okafor', role: 'PhD Researcher, Obafemi Awolowo University', content: 'I uploaded my messy chapter outline and PAGYS turned it into a structured thesis with proper headings and flow. Incredible.' },
    { name: 'Mensah Nyarko', role: 'MPhil Student, University of Cape Coast', content: 'The citation verification tool caught errors I would have missed. My bibliography was acceptance-ready in minutes.' },
    { name: 'Folake Adeleke', role: 'Master\'s Candidate, Covenant University', content: 'Exporting to PDF with all figures and references intact was seamless. My panel was impressed by the formatting.' },
    { name: 'Kwesi Boateng', role: 'PhD Candidate, University of Ghana', content: 'From introduction to conclusion, PAGYS helped me write each chapter with confidence. I graduated with distinction. Worth every pesewa.' },
    { name: 'Dr. Yakubu Ibrahim', role: 'Lecturer, Ahmadu Bello University', content: 'I recommend PAGYS to all my final-year students. It teaches them proper thesis structure while accelerating their writing.' },
    { name: 'Akosua Manu', role: 'MPhil Graduate, KNUST', content: 'Three months of writer\'s block vanished after I started using PAGYS. The progressive writing approach kept me going every day.' },
  ];

  const stats = [
    { number: '50K+', label: 'Hours Saved' },
    { number: '10K+', label: 'Happy Students' },
    { number: '100+', label: 'Universities' },
    { number: '98%', label: 'Success Rate' }
  ];

  const heroButtonStyle = {
    backgroundColor: colors.primary, color: 'white', padding: '16px 32px', borderRadius: '12px', border: 'none',
    fontSize: '18px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px',
    transition: 'all 0.2s', boxShadow: `0 8px 16px ${colors.primary}40`, cursor: 'pointer'
  };

  const learnMoreStyle = {
    backgroundColor: 'transparent', color: colors.text, padding: '16px 32px', borderRadius: '12px',
    textDecoration: 'none', fontSize: '18px', fontWeight: '600', border: `2px solid ${colors.border}`,
    transition: 'all 0.2s', display: 'inline-block'
  };

  return (
    <div style={{ backgroundColor: colors.background, minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: isDarkMode ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)' : 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)',
        padding: '80px 20px 60px', borderBottom: `1px solid ${colors.border}`
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', backgroundColor: colors.primary + '20', color: colors.primary, padding: '8px 16px', borderRadius: '30px', fontSize: '15px', fontWeight: '700', marginBottom: '24px' }}>Trusted by 10,000+ Students & Professionals</div>
          <h1 style={{ fontSize: 'clamp(25px, 5vw, 56px)', fontWeight: '800', color: colors.text, marginBottom: '20px', lineHeight: '1.2' }}>
            Write Your Thesis{' '}
            <span key={isDarkMode ? 'dark' : 'light'} style={{ background: `linear-gradient(135deg, ${colors.primary}, #9583b988)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Like A Pro</span>
          </h1>
          <p style={{ fontSize: '18px', color: colors.textSecondary, maxWidth: '700px', margin: '0 auto 32px', lineHeight: '1.6' }}>
            We help you write complete, well-structured thesis drafts tailored to your topic, field, and academic level. Save months of research and writing time.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleGetStarted} style={heroButtonStyle}
              onMouseEnter={(e) => { e.target.style.backgroundColor = colors.primaryDark; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = colors.primary; e.target.style.transform = 'translateY(0)'; }}>
              Get Started @ Just ₵30<span style={{ fontSize: '20px' }}>→</span>
            </button>
            <a href="#features" style={learnMoreStyle}
              onMouseEnter={(e) => { e.target.style.backgroundColor = colors.hover; e.target.style.borderColor = colors.primary; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.borderColor = colors.border; }}>
              Learn More
            </a>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '48px', flexWrap: 'wrap' }}>
            {stats.map((stat, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '23px', fontWeight: 'bold', color: colors.primary, marginBottom: '4px' }}>{stat.number}</div>
                <div style={{ color: colors.textSecondary, fontSize: '14px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="features" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: '12px' }}>Everything You Need to Write Your Thesis</h2>
          <p style={{ fontSize: '16px', color: colors.textSecondary, textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px', lineHeight: '1.6' }}>No fluff, no clutter — just the tools that actually get your thesis done.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
            {features.map((feature, index) => (
              <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} colors={colors} isDarkMode={isDarkMode} index={index} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', padding: '80px 20px', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: '48px' }}>What Our Users Say</h2>
          <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' }}
            onMouseEnter={(e) => { e.currentTarget.firstChild.style.animationPlayState = 'paused'; }}
            onMouseLeave={(e) => { e.currentTarget.firstChild.style.animationPlayState = 'running'; }}
          >
            <div style={{ display: 'flex', gap: '24px', animation: 'scroll 45s linear infinite', width: 'max-content' }}>
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <div key={index} style={{ flex: '0 0 340px' }}>
                  <TestimonialCard name={testimonial.name} role={testimonial.role} content={testimonial.content} colors={colors} isDarkMode={isDarkMode} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '80px 20px', flex: 1 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', backgroundColor: colors.surface, padding: '60px 40px', borderRadius: '24px', border: `1px solid ${colors.border}`, boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>Ready to Start Your Thesis?</h2>
          <p style={{ fontSize: '18px', color: colors.textSecondary, marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>Join thousands of students who have already aced their thesis with PAGYS</p>
          <button onClick={handleGetStarted} style={heroButtonStyle}
            onMouseEnter={(e) => { e.target.style.backgroundColor = colors.primaryDark; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = `0 12px 24px ${colors.primary}60`; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = colors.primary; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = `0 8px 16px ${colors.primary}40`; }}>
            Create Your Account
          </button>
          <p style={{ color: colors.textSecondary, fontSize: '14px', marginTop: '24px' }}>Stress free payment</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <Footer />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default HomePage;
