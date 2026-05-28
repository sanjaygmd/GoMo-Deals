import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary Caught An Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#110601', // Pure dark espresso cocoa
          color: '#ffffff',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          padding: '24px',
          textAlign: 'center',
          backgroundSize: 'cover'
        }}>
          {/* Ambient luxury backdrop glow */}
          <div style={{
            position: 'absolute',
            width: '350px',
            height: '350px',
            background: 'rgba(234, 88, 12, 0.08)',
            filter: 'blur(90px)',
            borderRadius: '50%',
            top: '20%',
            pointerEvents: 'none'
          }} />

          <div style={{
            background: 'rgba(30, 15, 8, 0.45)', // Premium dark glassmorphism
            backdropFilter: 'blur(20px)',
            borderRadius: '28px',
            border: '1px solid rgba(234, 88, 12, 0.16)', // Rich orange border
            padding: '54px 36px',
            maxWidth: '500px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Deals Theme Icon */}
            {/* <div style={{ fontSize: '72px', marginBottom: '20px', filter: 'drop-shadow(0 8px 16px rgba(234,88,12,0.25))' }}>🎪</div> */}
            
            <h1 style={{
              fontSize: '26px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: '0 0 16px 0',
              background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)', // Orange to Amber gradient
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Negotiation Interrupted
            </h1>
            
            <p style={{ 
              color: '#d4c5b9', 
              fontSize: '13px', 
              lineHeight: '1.7', 
              margin: '0 0 36px 0',
              fontWeight: '500',
              letterSpacing: '0.5px'
            }}>
              We ran into an unexpected interface rendering error. Don't worry, your shopping cart, active negotiations, and bargaining sessions are completely safe!
            </p>
            
            <button
              onClick={this.handleReset}
              style={{
                background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)', // Luxury espresso-orange button
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px', // Capsule styling
                padding: '14px 42px',
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 10px 20px rgba(234, 88, 12, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.04) translateY(-1px)';
                e.target.style.boxShadow = '0 12px 24px rgba(234, 88, 12, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1) translateY(0)';
                e.target.style.boxShadow = '0 10px 20px rgba(234, 88, 12, 0.2)';
              }}
            >
              Return to GoMo Deals
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
