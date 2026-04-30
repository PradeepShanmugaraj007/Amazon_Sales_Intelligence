import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  ShieldCheck,
  FileText,
  TrendingUp,
  ArrowRight,
  Check,
  ExternalLink,
  X,
  Link,
  Database,
  Zap,
  PieChart,
  Globe,
  Lock,
  Cpu,
  ChevronDown,
  Star,
  Quote,
  UploadCloud,
  Rocket,
  Sparkles,
  Server,
  Layers,
  Activity,
  Code,
  ShoppingBag,
  Terminal,
  Play
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGoogleLogin } from '@react-oauth/google';
import { analyzeReport } from '../api';
import { processData, fmt, BRAND, GREEN } from '../utils';
import '../landing.css';
import '../responsive_overrides.css';

interface LandingPageProps {
  onGetStarted: () => void;
  onTryFree: () => void;
  onLogin: () => void;
  onGoogleSuccess?: (response: any) => void;
}
export default function LandingPage({ onGetStarted, onTryFree, onLogin, onGoogleSuccess }: LandingPageProps) {
  const googleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      if (onGoogleSuccess) onGoogleSuccess(codeResponse);
    },
    onError: (error) => console.log('Login Failed:', error)
  });
  const [demoText, setDemoText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [msg, setMsg] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleFutureLink = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("This page is part of our Enterprise Portal and is currently under active development. Please contact sales for access.");
  };

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert("Successfully subscribed to SellerIQ Pro insights!");
  };

  const fullText = "Analyze March 2024 Amazon MTR for high-risk tax anomalies...";

  // Interactive Preview Placeholder for Landing Page
  const LandingDashboardPreview = () => (
    <div style={{ padding: '2rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl">
            <Activity size={24} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Enterprise Intelligence</div>
            <div className="text-xl font-black">Demo Edition Hub</div>
          </div>
        </div>
        <div className="badge bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Preview Mode</div>
      </div>

      <div style={{ height: 260, width: '100%', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px border rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Simple mockup chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, height: 160 }}>
          {[60, 40, 80, 50, 90, 70, 95].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 1.5, delay: i * 0.1 }}
              style={{ width: 30, background: `linear-gradient(to top, ${BRAND}, #818cf8)`, borderRadius: '8px 8px 0 0', opacity: 0.8 }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { l: "Revenue Snapshot", v: "₹12.4L", c: BRAND },
          { l: "Tax Breakdown", v: "₹1.2L", c: "#818cf8" },
          { l: "SKU Velocity", v: "Hot", c: "#10b981" }
        ].map((item, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>{item.l}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: item.c }}>{item.v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
          <b>Instant Analysis</b> is now available in our dedicated Demo Dashboard.
          <br />Upload files up to 1MB and get high-precision results in seconds.
        </p>
        <button onClick={onTryFree} className="btn-primary" style={{ marginTop: 12, padding: '0.6rem 1.4rem', fontSize: '0.8rem' }}>Open Demo Dashboard</button>
      </div>
    </div>
  );

  const chartData = [
    { name: 'Mon', rev: 4000 },
    { name: 'Tue', rev: 3000 },
    { name: 'Wed', rev: 6000 },
    { name: 'Thu', rev: 8000 },
    { name: 'Fri', rev: 5000 },
    { name: 'Sat', rev: 9000 },
    { name: 'Sun', rev: 12000 },
  ];

  useEffect(() => {
    if (isTyping) {
      if (demoText.length < fullText.length) {
        const timeout = setTimeout(() => {
          setDemoText(fullText.slice(0, demoText.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsTyping(false), 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      const timeout = setTimeout(() => {
        setDemoText('');
        setIsTyping(true);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [demoText, isTyping]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const glow = document.querySelector('.mouse-glow') as HTMLElement;
      if (glow) {
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
      }

      // Section specific glow
      const sectionGlow = document.querySelector('#features .section-glow') as HTMLElement;
      if (sectionGlow) {
        const section = document.getElementById('features');
        if (section) {
          const rect = section.getBoundingClientRect();
          sectionGlow.style.left = `${e.clientX - rect.left}px`;
          sectionGlow.style.top = `${e.clientY - rect.top}px`;
        }
      }

      // Card spotlights
      const cards = document.querySelectorAll('.feature-card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };

    const handleScroll = () => {
      const header = document.querySelector('header');
      if (window.scrollY > 50) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }

      const reveals = document.querySelectorAll('.fade-in-on-scroll');
      reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('fade-in');
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="landing-container">
      <div className="mouse-glow"></div>
      <div className="bg-grid"></div>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <header>
        <div className="logo">
          <img src="/selleriq-icon.png" alt="SellerIQ Pro Icon" className="logo-icon" />
          <div className="logo-wordmark">
            <div className="logo-name">SellerIQ <span>Pro</span></div>
            <div className="logo-tagline">Commerce Intelligence</div>
          </div>
        </div>
        <nav>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#analytics">Analytics</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
        </nav>
        <div className="auth-buttons">
          <button onClick={onLogin} className="btn-outline">Sign In</button>
          <button onClick={onGetStarted} className="btn-primary">Get Started</button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-bg-pattern"></div>
          <div className="hero-content fade-in">

            <h1>Unify Your Commerce Intelligence.</h1>
            <p>
              The enterprise standard for marketplace data. Transform complex Amazon, Shopify, and ERP data into
              actionable intelligence, automated compliance, and predictive growth.
            </p>
            <div className="hero-actions">
              <button onClick={onGetStarted} className="btn-primary">Deploy Your Intelligence <ArrowRight size={18} style={{ marginLeft: '8px', display: 'inline' }} /></button>
              <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} className="btn-outline" style={{ color: 'var(--text-main)', borderColor: 'var(--glass-border)', background: 'white' }}>Demo</button>
            </div>
            <div className="flex items-center gap-4" style={{ marginTop: '3rem' }}>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://picsum.photos/seed/user${i}/100/100`}
                    alt="User"
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <div className="text-sm font-medium text-dim">
                <span className="text-main font-bold">500+</span> global brands scaling with SellerIQ
              </div>
            </div>
          </div>
          <div className="hero-visual fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="floating-preview">
              <div className="preview-user">
                <img src="https://picsum.photos/seed/ceo/100/100" alt="CEO" referrerPolicy="no-referrer" />
                <div>
                  <div className="text-xs font-bold">Revenue Growth</div>
                  <div className="text-[10px] text-dim">Real-time tracking</div>
                </div>
              </div>
              <div className="preview-bar-group">
                <div className="preview-bar"><motion.div className="preview-bar-fill" animate={{ width: '85%' }} transition={{ duration: 2, delay: 1 }}></motion.div></div>
                <div className="preview-bar"><motion.div className="preview-bar-fill" animate={{ width: '65%' }} transition={{ duration: 2, delay: 1.2 }}></motion.div></div>
                <div className="preview-bar"><motion.div className="preview-bar-fill" animate={{ width: '95%' }} transition={{ duration: 2, delay: 1.4 }}></motion.div></div>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <div className="text-xl font-black text-primary">+₹12.4L</div>
                <div className="text-[10px] font-bold text-secondary">↑ 24%</div>
              </div>
            </div>
            <div className="bento-item bento-1 glass">
              <div>
                <div className="bento-label">Global Revenue</div>
                <div className="bento-value">₹84.2L</div>
              </div>
              <div className="bento-chart-line"></div>
            </div>
            <div className="bento-item bento-2 glass">
              <div>
                <div className="bento-label">Risk Score</div>
                <div className="bento-value" style={{ color: 'var(--secondary)', background: 'none', WebkitTextFillColor: 'initial' }}>98.4%</div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={24} className="text-secondary" />
                <span className="text-xs font-bold text-dim">AI Protected</span>
              </div>
            </div>
            <div className="bento-item bento-3 glass">
              <div>
                <div className="bento-label">Active Flows</div>
                <div className="bento-value">12</div>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={24} className="text-amber-600" />
                <span className="text-xs font-bold text-dim">Real-time Sync</span>
              </div>
            </div>
          </div>
        </section>

        <section className="depth-signals">
          <div className="signal-item">
            <Cpu size={20} />
            <span>Advanced AI Models</span>
          </div>
          <div className="signal-item">
            <Server size={20} />
            <span>Large-Scale Data Handling</span>
          </div>
          <div className="signal-item">
            <Layers size={20} />
            <span>Enterprise-Ready Architecture</span>
          </div>
        </section>

        <section id="demo" className="live-demo-section" style={{ padding: '5rem 2rem', background: 'var(--bg-soft)', position: 'relative' }}>
          <div className="section-glow" style={{ top: '50%', left: '50%', opacity: 0.1 }}></div>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="badge" style={{ marginBottom: '1.5rem' }}>Core Intelligence</div>
            <h2 className="section-title">The Demo Dashboard</h2>
            <p className="section-subtitle">Experience how SellerIQ Pro converts raw marketplace noise into analytical signals. <b>Get started with a 1MB Demo Analysis.</b></p>
          </div>

          <div className="live-demo-container fade-in-on-scroll">
            <div className="demo-window" style={{
              boxShadow: '0 50px 100px -20px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              minHeight: 500
            }}>
              <div className="demo-header" style={{ background: '#1e293b' }}>
                <div className="flex gap-2 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={12} />
                  SellerIQ Dashboard Preview
                </div>
              </div>

              <div className="demo-body" style={{ background: '#0f172a', color: '#f8fafc', padding: '0', minHeight: 450, position: 'relative' }}>
                {LandingDashboardPreview()}
              </div>
            </div>
          </div>
        </section>

        <section className="amazon-sync-section">
          <div className="sync-container">
            <div className="sync-visual fade-in">
              <div className="sync-pulse"></div>
              <div className="sync-pulse delay-1"></div>
              <div className="sync-pulse delay-2"></div>
              <div className="amazon-logo-wrapper">
                <img
                  src="https://www.vectorlogo.zone/logos/amazon/amazon-icon.svg"
                  alt="Amazon"
                  className="amazon-sync-icon"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="sync-data-flow">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="data-dot"
                    animate={{
                      x: [-150, 0],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "linear"
                    }}
                    style={{
                      top: `${25 + i * 10}%`,
                      left: '0'
                    }}
                  />
                ))}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i + 6}
                    className="data-dot"
                    animate={{
                      x: [150, 0],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "linear"
                    }}
                    style={{
                      top: `${25 + i * 10}%`,
                      right: '0'
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="sync-info fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="badge">Native MTR Integration</div>
              <h2>Architected for Amazon</h2>
              <p>
                SellerIQ Pro is built from the ground up to handle the unique complexities of
                Amazon Merchant Tax Reports. Our engine provides 100% reconciliation accuracy
                with zero manual effort.
              </p>
              <div className="sync-status">
                <div className="status-indicator">
                  <div className="status-dot"></div>
                  <div className="status-ping"></div>
                </div>
                <span>Live Amazon MTR Sync Active</span>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        <section id="how-it-works" className="how-it-works">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="badge" style={{ marginBottom: '1.5rem' }}>Process</div>
            <h2 className="section-title fade-in-on-scroll">How SellerIQ Pro Works</h2>
            <p className="section-subtitle fade-in-on-scroll">Three simple steps to unlock your marketplace intelligence.</p>
          </div>
          <div className="steps-container">
            {[
              {
                icon: (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <UploadCloud size={32} />
                  </motion.div>
                ),
                title: "Upload Data",
                desc: "Securely upload your Amazon MTR or Shopify CSV files. Our engine handles the rest.",
                color: "var(--primary)"
              },
              {
                icon: (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Cpu size={32} />
                  </motion.div>
                ),
                title: "AI Analysis",
                desc: "Our proprietary algorithms scrub for risks, calculate taxes, and identify trends.",
                color: "var(--secondary)"
              },
              {
                icon: (
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Rocket size={32} />
                  </motion.div>
                ),
                title: "Scale Fast",
                desc: "Get actionable insights and automated reports to grow your business with confidence.",
                color: "var(--accent)"
              }
            ].map((step, i) => (
              <div key={i} className="step-card fade-in-on-scroll">
                <div className="step-number">0{i + 1}</div>
                <div className="step-icon" style={{ color: step.color }}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < 2 && <div className="step-connector"></div>}
              </div>
            ))}
          </div>
        </section>

        <div className="section-divider"></div>

        <section id="features" className="features">
          <div className="section-glow"></div>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="badge" style={{ marginBottom: '1.5rem' }}>Capabilities</div>
            <h2 className="section-title fade-in-on-scroll">Enterprise-Grade Features</h2>
            <p className="section-subtitle fade-in-on-scroll">Everything you need to scale your marketplace operations with confidence.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card feature-ingestion glass fade-in-on-scroll">
              <div className="feature-image">
                <img src="/feature_data_ingestion_png_1776314911908.png" alt="Data Ingestion" />
              </div>
              <div className="feature-icon"><Database /></div>
              <h3>Data Ingestion</h3>
              <p>Automated CSV upload parsing for Amazon MTR, Shopify, and custom ERP flows with 99.9% accuracy.</p>
            </div>
            <div className="feature-card feature-risk glass fade-in-on-scroll">
              <div className="feature-image">
                <img src="/feature_risk_scrubbing_png_1776314928014.png" alt="Risk Scrubbing" />
              </div>
              <div className="feature-icon"><ShieldCheck /></div>
              <h3>Risk Scrubbing</h3>
              <p>Advanced AI Fraud & Risk Analysis engine to protect your revenue streams from suspicious activities.</p>
            </div>
            <div className="feature-card feature-tax glass fade-in-on-scroll">
              <div className="feature-image">
                <img src="/feature_tax_compliance_png_1776314943200.png" alt="Tax Compliance" />
              </div>
              <div className="feature-icon"><FileText /></div>
              <h3>Tax Compliance</h3>
              <p>Automated GST/Tax breakdown and reporting for multi-channel operations, ready for filing.</p>
            </div>
            <div className="feature-card feature-forecasting glass fade-in-on-scroll">
              <div className="feature-image">
                <img src="/feature_forecasting_png_1776314957403.png" alt="Predictive Forecasting" />
              </div>
              <div className="feature-icon"><TrendingUp /></div>
              <h3>Predictive Forecasting</h3>
              <p>Algorithmic revenue forecasting based on historical trends, seasonality, and market data.</p>
            </div>
            <div className="feature-card feature-scaling glass fade-in-on-scroll">
              <div className="feature-image">
                <img src="/feature_global_scaling_png_1776314971687.png" alt="Global Scaling" />
              </div>
              <div className="feature-icon"><Globe /></div>
              <h3>Global Scaling</h3>
              <p>Support for multiple currencies and international marketplaces with localized reporting.</p>
            </div>
            <div className="feature-card feature-security glass fade-in-on-scroll">
              <div className="feature-image">
                <img src="/feature_security_png_1776314984952.png" alt="Bank-Level Security" />
              </div>
              <div className="feature-icon"><Lock /></div>
              <h3>Bank-Level Security</h3>
              <p>Enterprise-grade encryption and SOC2 compliant data handling for your business intelligence.</p>
            </div>

            {/* New Features */}
            <div className="feature-card glass fade-in-on-scroll">
              <div className="feature-image">
                <img src="/feature_realtime_png_1776314998914.png" alt="Real-time Processing" />
              </div>
              <div className="feature-icon"><Activity /></div>
              <h3>Real-time Processing</h3>
              <p>Sub-second data synchronization across all your marketplace channels and ERP systems.</p>
            </div>
            <div className="feature-card glass fade-in-on-scroll">
              <div className="feature-image">
                <img src="/feature_insights_png_1776315017119.png" alt="Data-driven Insights" />
              </div>
              <div className="feature-icon"><PieChart /></div>
              <h3>Data-driven Insights</h3>
              <p>Deep-dive analytics that uncover hidden opportunities for margin optimization and growth.</p>
            </div>
            <div className="feature-card glass fade-in-on-scroll">
              <div className="feature-image">
                <img src="/feature_api_png_1776315031255.png" alt="API-ready Integration" />
              </div>
              <div className="feature-icon"><Code /></div>
              <h3>API-ready Integration</h3>
              <p>Robust REST APIs and webhooks to integrate SellerIQ intelligence into your existing tech stack.</p>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        <section className="use-cases">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="badge" style={{ marginBottom: '1.5rem' }}>Use Cases</div>
            <h2 className="section-title">Built for Every Scale</h2>
            <p className="section-subtitle">Tailored solutions for different business needs.</p>
          </div>
          <div className="use-cases-grid">
            <div className="use-case-card fade-in-on-scroll">
              <div className="use-case-icon"><ShoppingBag /></div>
              <h3>D2C Brands</h3>
              <p>Consolidate Shopify and Amazon data to understand your true customer acquisition cost and LTV.</p>
            </div>
            <div className="use-case-card fade-in-on-scroll">
              <div className="use-case-icon"><Database /></div>
              <h3>Marketplace Aggregators</h3>
              <p>Manage hundreds of brands in a single dashboard with unified reporting and automated auditing.</p>
            </div>
            <div className="use-case-card fade-in-on-scroll">
              <div className="use-case-icon"><ShieldCheck /></div>
              <h3>Tax Professionals</h3>
              <p>Automate the heavy lifting of marketplace tax reconciliation and provide accurate reports to clients.</p>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        <section id="analytics" className="analytics" style={{ background: 'white', padding: '5rem 2rem' }}>
          <div className="analytics-content fade-in-on-scroll">
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="amazon-badge-top" style={{ marginBottom: '2rem' }}>
                <img
                  src="https://www.vectorlogo.zone/logos/amazon/amazon-icon.svg"
                  alt="Amazon"
                  className="amazon-top-logo"
                />
                <span className="font-black text-[10px] tracking-[0.2em] uppercase">Intelligence Engine</span>
              </div>
              <h2 className="section-title">Analytical Precision by Design</h2>
              <p className="section-subtitle">
                Stop relying on spreadsheets. Our intelligence engine provides the only 100% accurate reconciliation
                standard for enterprise marketplace operations.
              </p>
            </div>

            <div className="analytics-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem', maxWidth: '1400px', margin: '0 auto' }}>
              {/* Main Charts area */}
              <div className="charts-column">
                {/* Bar Chart Section (TOP) */}
                <div className="chart-preview-box glass mb-10" style={{ padding: '2rem', borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', background: '#fff' }}>
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Inventory Velocity (Daily)</div>
                    <div className="badge bg-indigo-50 text-primary border-none text-[10px]">Real-time</div>
                  </div>
                  <div className="chart-bars" style={{ height: 250, display: 'flex', alignItems: 'flex-end', gap: '1rem', padding: '0 1rem' }}>
                    {[
                      { h: '65%', t: '₹8.2L', d: 0.1 },
                      { h: '85%', t: '₹12.4L', d: 0.2 },
                      { h: '55%', t: '₹6.1L', d: 0.3 },
                      { h: '95%', t: '₹15.8L', d: 0.4 },
                      { h: '75%', t: '₹10.2L', d: 0.5 },
                      { h: '90%', t: '₹13.5L', d: 0.6 },
                      { h: '80%', t: '₹11.2L', d: 0.7 }
                    ].map((bar, i) => (
                      <motion.div
                        key={i}
                        className="bar"
                        initial={{ height: 0 }}
                        whileInView={{ height: bar.h }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: bar.d, ease: "easeOut" }}
                        style={{ flex: 1, background: 'linear-gradient(to top, var(--primary), #818cf8)', borderRadius: '8px 8px 4px 4px', position: 'relative' }}
                      >
                        <span className="bar-tooltip" style={{ opacity: 1, bottom: '105%' }}>{bar.t}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Line Chart Section (BELOW) */}
                <div className="chart-preview-box glass" style={{ padding: '2rem', borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', background: '#fff' }}>
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Revenue Trajectory</div>
                    <TrendingUp size={16} className="text-primary" />
                  </div>
                  <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                        />
                        <YAxis hide />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="rev"
                          stroke="#4f46e5"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRev)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Side Column info area (Details) */}
              <div className="details-column">
                <div style={{ position: 'sticky', top: '8rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {[
                    { label: 'Total Marketplace Revenue', value: '₹24.8L', trend: '↑ 18.4%', desc: 'Unified cross-channel rev.', tint: '#10b981' },
                    { label: 'Audit Reconciliation', value: '100.0%', trend: 'Verified', desc: 'No transaction gaps found.', tint: '#6366f1' },
                    { label: 'MTR Processing Level', value: 'Tier 3', trend: 'Priority', desc: 'Advanced scrubbing active.', tint: '#f59e0b' },
                    { label: 'Estimated Tax Liability', value: '₹4.2L', trend: 'Calculated', desc: 'Ready for GSTR filing.', tint: '#8b5cf6' }
                  ].map((stat, i) => (
                    <div key={i} style={{
                      padding: '1.5rem',
                      borderRadius: '1.5rem',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.5rem' }}>{stat.label}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>{stat.value}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '99px', background: `${stat.tint}15`, color: stat.tint }}>{stat.trend}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>{stat.desc}</span>
                      </div>
                    </div>
                  ))}

                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '1.5rem',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    color: 'white',
                    boxShadow: '0 10px 30px -10px rgba(79, 70, 229, 0.5)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <ShieldCheck size={20} color="#c7d2fe" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e0e7ff' }}>Enterprise SOC2</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#c7d2fe', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                      Your business data is processed using bank-level isolated compute nodes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        <section className="testimonials">
          <div className="testimonials-container">
            <div className="testimonials-header fade-in-on-scroll">
              <div className="badge">Success Stories</div>
              <h2>Trusted by 500+ Enterprise Sellers</h2>
              <p>See how SellerIQ Pro is transforming marketplace operations globally.</p>
            </div>
            <div className="testimonials-grid">
              {[
                {
                  name: "Rahul Sharma",
                  role: "CEO, TechGadgets India",
                  text: "SellerIQ Pro saved us over 40 hours a month in tax reconciliation. The Amazon MTR sync is flawless.",
                  avatar: "https://picsum.photos/seed/rahul/100/100"
                },
                {
                  name: "Sarah Jenkins",
                  role: "Operations Head, GlobalTrade",
                  text: "The risk scrubbing feature identified ₹12L in suspicious transactions within the first week. Essential tool.",
                  avatar: "https://picsum.photos/seed/sarah/100/100"
                },
                {
                  name: "Amit Patel",
                  role: "Founder, HomeDecor Pro",
                  text: "Predictive forecasting has completely changed how we manage inventory. No more stockouts during peak season.",
                  avatar: "https://picsum.photos/seed/amit/100/100"
                }
              ].map((t, i) => (
                <div key={i} className="testimonial-card glass fade-in-on-scroll">
                  <div className="quote-icon"><Quote size={24} /></div>
                  <p>"{t.text}"</p>
                  <div className="testimonial-user">
                    <img src={t.avatar} alt={t.name} referrerPolicy="no-referrer" />
                    <div>
                      <div className="user-name">{t.name}</div>
                      <div className="user-role">{t.role}</div>
                    </div>
                  </div>
                  <div className="stars">
                    {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        <section id="pricing" className="pricing">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="badge" style={{ marginBottom: '1.5rem' }}>Pricing</div>
            <h2 className="section-title fade-in-on-scroll">Simple, Scalable Pricing</h2>
            <p className="section-subtitle fade-in-on-scroll">Choose the plan that fits your business stage.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card glass fade-in-on-scroll">
              <div>
                <h3>Starter</h3>
                <div className="price">₹3,060<span>/yr</span></div>
              </div>
              <ul className="features-list">
                <li><Check className="check" size={18} /> 3 files per month</li>
                <li><Check className="check" size={18} /> Up to 5,000 orders</li>
                <li><Check className="check" size={18} /> Email Support</li>
                <li><Check className="check" size={18} /> Basic Analytics</li>
              </ul>
              <button onClick={onGetStarted} className="btn-outline">Choose Starter</button>
            </div>

            <div className="pricing-card glass pro fade-in-on-scroll">
              <div>
                <div className="badge" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>Most Popular</div>
                <h3>Pro</h3>
                <div className="price">₹15,300<span>/yr</span></div>
              </div>
              <ul className="features-list">
                <li><Check className="check" size={18} /> 10 files per month</li>
                <li><Check className="check" size={18} /> Up to 25,000 orders</li>
                <li><Check className="check" size={18} /> 24/7 Priority Support</li>
                <li><Check className="check" size={18} /> AI Fraud Detection</li>
                <li><Check className="check" size={18} /> Predictive Forecasting</li>
              </ul>
              <button onClick={onGetStarted} className="btn-primary">Choose Pro</button>
            </div>

            <div className="pricing-card glass fade-in-on-scroll">
              <div>
                <h3>Enterprise</h3>
                <div className="price">₹50,989<span>/yr</span></div>
              </div>
              <ul className="features-list">
                <li><Check className="check" size={18} /> 30 files per month</li>
                <li><Check className="check" size={18} /> Unlimited orders</li>
                <li><Check className="check" size={18} /> 24/7 Call Support</li>
                <li><Check className="check" size={18} /> Full API Access</li>
                <li><Check className="check" size={18} /> Custom Integrations</li>
              </ul>
              <button onClick={onGetStarted} className="btn-outline">Contact Sales</button>
            </div>
          </div>
        </section>

        <section id="faq" className="faq">
          <div className="faq-container">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div className="badge" style={{ marginBottom: '1.5rem' }}>Support</div>
              <h2 className="section-title fade-in-on-scroll">Frequently Asked Questions</h2>
              <p className="section-subtitle fade-in-on-scroll">Everything you need to know about SellerIQ Pro.</p>
            </div>
            <div className="faq-grid">
              {[
                { q: "How secure is my Amazon data?", a: "We use bank-level AES-256 encryption. Your data is processed in isolated environments and is never shared with third parties." },
                { q: "Do you support international marketplaces?", a: "Yes, we support Amazon marketplaces across North America, Europe, and Asia, with full currency conversion." },
                { q: "Can I cancel my subscription anytime?", a: "Absolutely. We offer a no-questions-asked cancellation policy. You can export your data before leaving." },
                { q: "How accurate is the tax reconciliation?", a: "Our engine provides 99.9% accuracy, matching your Merchant Tax Reports directly with bank settlements." }
              ].map((item, i) => (
                <div key={i} className="fade-in-on-scroll">
                  <div className={`faq-item glass ${openFaq === i ? 'active' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ cursor: 'pointer' }}>
                    <div className="faq-question" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>{item.q}</h3>
                      <ChevronDown size={20} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
                    </div>
                    <AnimatePresence initial={false}>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="faq-answer" style={{ paddingTop: '1rem', paddingBottom: '0.5rem' }}>
                            <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.6 }}>{item.a}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        <section id="legal" className="legal-sections">
          <div className="legal-grid fade-in-on-scroll">
            <div className="legal-card glass">
              <h3>Privacy Policy</h3>
              <p>Your data privacy is our top priority. We use enterprise-grade encryption for all Amazon MTR and Shopify data flows. We never share your business intelligence with third parties.</p>
              <ul>
                <li>End-to-end data encryption</li>
                <li>GDPR & CCPA Compliant</li>
                <li>No data sharing with competitors</li>
              </ul>
            </div>
            <div className="legal-card glass">
              <h3>Terms of Service</h3>
              <p>By using SellerIQ Pro, you agree to our fair usage policy. Our platform is designed for legitimate eCommerce businesses to automate their tax and risk analysis.</p>
              <ul>
                <li>99.9% Uptime SLA</li>
                <li>Fair usage data limits</li>
                <li>Monthly/Annual billing cycles</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="contact" className="contact">
          <div className="contact-content fade-in-on-scroll">
            <div className="badge" style={{ marginBottom: '1.5rem' }}>Contact Us</div>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>Ready to Scale?</h2>
            <p className="section-subtitle" style={{ marginBottom: '2.5rem' }}>Have questions about enterprise integration? Our team is here to help.</p>
            <div className="contact-info">
              <div className="contact-item">
                <Zap className="text-primary" />
                <span>support@selleriq.pro</span>
              </div>
              <div className="contact-item">
                <ShieldCheck className="text-secondary" />
                <span>Enterprise Support: 24/7 Priority</span>
              </div>
            </div>
            <button onClick={onGetStarted} className="btn-primary" style={{ padding: '1.1rem 2.5rem', fontSize: '1.05rem' }}>Contact Sales Team</button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="logo" style={{ marginBottom: '1.5rem' }}>
                <div className="logo-icon">
                  <BarChart3 size={24} color="white" />
                </div>
                <span className="logo-text">SellerIQ Pro</span>
              </div>
              <p>The enterprise standard for marketplace intelligence and automated tax compliance.</p>
              <div className="social-links">
                <a href="#" onClick={handleFutureLink} className="social-icon"><X size={20} /></a>
                <a href="#" onClick={handleFutureLink} className="social-icon"><ExternalLink size={20} /></a>
                <a href="#" onClick={handleFutureLink} className="social-icon"><Link size={20} /></a>
              </div>
            </div>
            <div className="footer-links-grid">
              <div className="link-group">
                <h4>Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#analytics">Analytics</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#how-it-works">How it Works</a></li>
                </ul>
              </div>
              <div className="link-group">
                <h4>Company</h4>
                <ul>
                  <li><a href="#" onClick={handleFutureLink}>About Us</a></li>
                  <li><a href="#" onClick={handleFutureLink}>Careers</a></li>
                  <li><a href="#" onClick={handleFutureLink}>Security</a></li>
                  <li><a href="#legal">Legal</a></li>
                </ul>
              </div>
              <div className="link-group">
                <h4>Resources</h4>
                <ul>
                  <li><a href="#" onClick={handleFutureLink}>Documentation</a></li>
                  <li><a href="#" onClick={handleFutureLink}>Help Center</a></li>
                  <li><a href="#" onClick={handleFutureLink}>API Reference</a></li>
                  <li><a href="#" onClick={handleFutureLink}>Community</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-newsletter">
              <h4>Stay Updated</h4>
              <p>Get the latest eCommerce insights delivered to your inbox.</p>
              <form className="newsletter-form" onSubmit={handleSubscribe}>
                <input type="email" placeholder="Enter your email" required />
                <button type="submit" className="btn-primary">Subscribe</button>
              </form>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 SellerIQ Pro. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#" onClick={handleFutureLink}>Privacy</a>
              <a href="#" onClick={handleFutureLink}>Terms</a>
              <a href="#" onClick={handleFutureLink}>Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
