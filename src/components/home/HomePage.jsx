import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Footer from '../layout/Footer';
import FeatureCard from './FeatureCard';
import TestimonialCard from './TestimonialCard';

const HomePage = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
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
    if (isLoggedIn) { alert('You are already logged in! Please logout first to create a new account.'); }
    else { navigate('/signup'); }
  };

  const features = [
    { icon: '🤖', title: 'AI-Powered Writing', description: 'Generate well-researched, properly structured academic content tailored to your topic and field.' },
    { icon: '📚', title: 'Real Citations', description: 'Automatically generate properly formatted references in APA, MLA, Harvard, and more.' },
    { icon: '🎯', title: 'Chapter by Chapter', description: 'Work through your thesis systematically with our guided chapter structure.' },
    { icon: '✏️', title: 'Humanise & Edit', description: 'Refine AI-generated content to match your unique voice and academic style.' },
    { icon: '📊', title: 'Progress Tracking', description: 'Track your writing progress and stay motivated with visual progress indicators.' },
    { icon: '🔒', title: 'Secure & Private', description: 'Your research and content are private and secure. You own everything you create.' }
  ];

  const testimonials = [
    { name: 'Sarah Johnson', role: 'PhD Candidate, Stanford', content: 'PAGYS saved me months of work. The AI understood my research topic perfectly and generated content that was actually useful.' },
    { name: 'Michael Chen', role: 'Master\'s Student, MIT', content: 'The chapter structure feature is brilliant. It kept me organized and the citations were formatted perfectly in APA style.' },
    { name: 'Dr. Emily Rodriguez', role: 'Research Fellow, Oxford', content: 'As a supervisor, I recommend PAGYS to my students. It helps them structure their thoughts and focus on the actual research.' }
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
            <span style={{ background: `linear-gradient(135deg, ${colors.primary}, #9583b988)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Like A Pro</span>
          </h1>
          <p style={{ fontSize: '18px', color: colors.textSecondary, maxWidth: '700px', margin: '0 auto 32px', lineHeight: '1.6' }}>
            Generate complete, well-structured thesis drafts tailored to your topic, field, and academic level. Save months of research and writing time.
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
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: '48px' }}>Everything You Need to Write Your Thesis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {features.map((feature, index) => (
              <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} colors={colors} isDarkMode={isDarkMode} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', padding: '80px 20px', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: '48px' }}>What Our Users Say</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} name={testimonial.name} role={testimonial.role} content={testimonial.content} colors={colors} isDarkMode={isDarkMode} />
            ))}
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

      <Footer />
    </div>
  );
};

export default HomePage;
