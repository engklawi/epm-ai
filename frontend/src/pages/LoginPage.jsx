import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Left Panel - Branding */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          {/* DGA Logo */}
          <img
            src="/DGA Logo-01_0.png"
            alt="DGA"
            style={styles.dgaLogo}
          />

          {/* Bayan Branding */}
          <div style={styles.bayanSection}>
            <div style={styles.bayanBadge}>
              <img
                src="/bayan_avatar.png"
                alt="Bayan"
                style={styles.bayanAvatar}
              />
            </div>
            <h1 style={styles.bayanTitle}>Bayan</h1>
            <p style={styles.bayanSubtitle}>بيان</p>
            <p style={styles.bayanDesc}>
              AI-Powered Project Intelligence
            </p>
          </div>

          {/* Feature highlights */}
          <div style={styles.features}>
            <div style={styles.featureItem}>
              <div style={styles.featureDot} />
              <span>Real-time Portfolio Analytics</span>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureDot} />
              <span>Predictive Risk Management</span>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureDot} />
              <span>Strategic Alignment Insights</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div style={styles.decorCircle1} />
        <div style={styles.decorCircle2} />
      </div>

      {/* Right Panel - Login Form */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.welcomeText}>Welcome back</h2>
            <p style={styles.instructionText}>Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.com"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p style={styles.footer}>
            Contact your administrator for access
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  // Left Panel
  leftPanel: {
    flex: '0 0 45%',
    background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: 48,
  },
  leftContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 360,
  },
  dgaLogo: {
    width: 180,
    height: 'auto',
    marginBottom: 48,
    filter: 'brightness(0) invert(1)',
  },
  bayanSection: {
    marginBottom: 48,
  },
  bayanBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
  bayanAvatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  bayanTitle: {
    color: 'white',
    fontSize: '2rem',
    fontWeight: 700,
    margin: '0 0 4px',
    letterSpacing: '-0.02em',
  },
  bayanSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '1.1rem',
    margin: '0 0 12px',
    fontWeight: 400,
  },
  bayanDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.95rem',
    margin: 0,
    fontWeight: 400,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'flex-start',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: '0.88rem',
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.8)',
    boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)',
  },
  decorCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
    top: -100,
    right: -100,
  },
  decorCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
    bottom: -80,
    left: -80,
  },

  // Right Panel
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fafbfc',
    padding: 48,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  formHeader: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
  },
  instructionText: {
    color: '#64748b',
    fontSize: '0.95rem',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 12,
    color: '#dc2626',
    fontSize: '0.88rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#374151',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    color: '#9ca3af',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 46px',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    color: '#1e293b',
    background: 'white',
    boxSizing: 'border-box',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '14px 24px',
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: 8,
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.35)',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.82rem',
    color: '#94a3b8',
    marginTop: 28,
  },
};
