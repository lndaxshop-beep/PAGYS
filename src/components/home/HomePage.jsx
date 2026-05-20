import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Footer from '../layout/Footer';
import FeatureCard from './FeatureCard';
import TestimonialCard from './TestimonialCard';
import { useCurrency } from '../../hooks/useCurrency';
import { PRICES_USD } from '../../constants/pricing';

const HomePage = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { fmt } = useCurrency();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    if (isLoggedIn) { navigate('/dashboard'); }
    else { navigate('/signup'); }
  };

  const features = [
    { icon: '📖', title: 'From Blank Page to Full Thesis', description: 'Guided chapter-by-chapter writing from Proposal through Chapter 5. Each section builds on the last — introduction, lit review, methodology, results, discussion, and conclusion.' },
    { icon: '📋', title: 'Smart Chapter Outlines', description: 'Tell us your topic, field, and methodology. We generate a complete, properly numbered subsection structure for every chapter — exactly what your supervisor expects.' },
    { icon: '📚', title: 'Real Citations, Auto-Formatted', description: 'Every citation verified from real academic sources. APA, MLA, Harvard, Chicago, or IEEE — formatted perfectly so your bibliography is submission-ready.' },
    { icon: '🎯', title: 'Research Findings Built In', description: 'Upload your survey data and we build Chapter 4 with proper demographic tables, descriptive statistics, bar charts, pie charts, and line graphs — all referencing your actual numbers.' },
    { icon: '📊', title: 'Professional Tables, Charts & Diagrams', description: 'Your thesis includes proper markdown tables, professional bar/line/pie charts, and conceptual framework diagrams — all numbered and captioned correctly.' },
    { icon: '🔬', title: 'Data Collection Instruments', description: 'Generate questionnaires, interview guides, observation checklists, focus group protocols, and more — all tailored to your research design and methodology.' },
    { icon: '🏛️', title: 'Your Personal Source Library', description: 'Upload research papers, extract their metadata automatically, build a literature matrix, and cross-reference everything from one place.' },
    { icon: '⚡', title: 'Apply Supervisor Feedback Instantly', description: 'Got corrections from your supervisor? Paste their feedback and we update the section while preserving your citations, data, and structure.' },
    { icon: '📄', title: 'One-Click Thesis Assembly', description: 'Merge all chapters into a complete .docx with title page, declaration, dedication, abstract, table of contents, list of figures, references, and appendices. Export as .docx, .pdf, .tex, or .md.' },
    { icon: '🔍', title: 'Self-Review That Fixes Your Writing', description: 'Every subsection goes through an academic quality check — fixing banned phrases, improving sentence rhythm, and ensuring proper academic tone throughout.' },
    { icon: '🛡️', title: 'Defence Preparation', description: 'Generate potential defence questions with model answers for every chapter. Practice with confidence and walk into your viva prepared.' },
    { icon: '✅', title: 'Progress Tracking & Version History', description: 'See exactly how far along each chapter is. Every edit is saved — compare versions, restore previous drafts, and never lose your work.' },
  ];

  const testimonials = [
    { name: 'Anthony Mensah', role: 'PhD Graduate, KNUST', content: 'PAGYS took my thesis from scattered notes to a defendable draft in two weeks. The chapter structure alone saved me a full semester of work.' },
    { name: 'Daniel Kekeli Glover', role: 'MPhil Student, University of Ghana', content: 'I was stuck on my literature review for months. I finished Chapter 2 in one weekend. The citation system is a lifesaver.' },
    { name: 'Mary Osowochi', role: 'MSc Graduate, University of Lagos', content: 'My supervisor kept rejecting my drafts until I used PAGYS. The academic quality finally got me a green light on my first full submission.' },
    { name: 'Patricia Amankwah', role: 'PhD Candidate, UPSA', content: 'Balancing full-time work with a thesis was impossible until I found this. The guided writing kept me on track and I submitted on time.' },
    { name: 'Michael Ofori-Atta', role: "Master's Graduate, University of Ibadan", content: 'Writing the methodology chapter was a nightmare. This tool generated a solid quantitative framework that needed only minor tweaks.' },
    { name: 'Sarah Aboagye', role: 'Final Year, Pentecost University', content: 'The text refinement feature is pure gold. It turned my rough drafts into something that actually reads like a proper academic paper.' },
    { name: 'Emmanuel Asare', role: 'PhD Researcher, Obafemi Awolowo University', content: 'I uploaded my messy chapter outline and PAGYS turned it into a properly structured thesis with correct headings and logical flow. Incredible.' },
    { name: 'Elizabeth Nartey', role: 'MPhil Student, University of Cape Coast', content: 'The citation verification caught errors I would have missed. My bibliography was acceptance-ready in minutes.' },
    { name: 'Joseph Adjei', role: "Master's Graduate, Covenant University", content: 'Exporting to PDF with all figures, tables, and references intact was seamless. My panel was impressed by the formatting.' },
    { name: 'Grace Lartey', role: 'PhD Candidate, University of Ghana', content: 'From introduction to conclusion, I wrote each chapter with confidence. Graduated with distinction. Worth every pesewa.' },
    { name: 'Francis Nkrumah', role: 'Lecturer, Ahmadu Bello University', content: 'I recommend PAGYS to all my final-year students. It teaches proper thesis structure while dramatically accelerating the writing process.' },
    { name: 'Linda Mensah-Bonsu', role: 'MPhil Graduate, KNUST', content: 'Three months of writer\'s block vanished after I started. The step-by-step approach kept me writing every single day until completion.' },
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
            From your research topic to a complete, submission-ready thesis — PAGYS walks you through every step. Structured outlines, verified academic references, professional tables and charts, and one-click document assembly. Everything you need, nothing you don't.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleGetStarted} style={heroButtonStyle}
              onMouseEnter={(e) => { e.target.style.backgroundColor = colors.primaryDark; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = colors.primary; e.target.style.transform = 'translateY(0)'; }}>
               Get Started @ Just {fmt(PRICES_USD.regular)}<span style={{ fontSize: '20px' }}>→</span>
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
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: '12px' }}>Your Complete Thesis Toolkit</h2>
          <p style={{ fontSize: '16px', color: colors.textSecondary, textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px', lineHeight: '1.6' }}>Twelve features designed to take you from your research topic to a submission-ready thesis — no gaps, no guesswork.</p>
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
    </div>
  );
};

export default HomePage;
