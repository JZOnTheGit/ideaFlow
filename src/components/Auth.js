import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import styled from 'styled-components';
import '../styles/stars.css';
import { validateEmail, validatePassword, validatePasswordMatch } from '../utils/validation';
import { authLimiter, resetLimiter } from '../utils/rateLimiter';

const BackButton = styled.button`
  position: fixed;
  top: 2rem;
  left: 2rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: #c49952;
  border: 2px solid #c49952;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;

  &:hover {
    background: rgba(196, 153, 82, 0.1);
    transform: translateY(-2px);
  }
`;

const AuthContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #000;
  position: relative;
  overflow: hidden;
`;

const AuthCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  color: #c49952;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.8rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.8rem;
  border-radius: 4px;
  border: 1px solid ${props => props.$error ? '#ff4444' : 'rgba(196, 153, 82, 0.3)'};
  background: rgba(255, 255, 255, 0.05);
  color: white;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #c49952;
  }
`;

const Button = styled.button`
  padding: 0.8rem;
  border: none;
  border-radius: 4px;
  background: #c49952;
  color: black;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #b38a43;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const GoogleButton = styled(Button)`
  background: transparent;
  border: 1px solid #c49952;
  color: #c49952;
  margin-top: 1rem;

  &:hover {
    background: rgba(196, 153, 82, 0.1);
  }
`;

const ToggleText = styled.p`
  color: #c49952;
  text-align: center;
  margin-top: 1rem;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.$success ? '#4CAF50' : '#ff4444'};
  text-align: center;
  margin-top: 1rem;
  padding: ${props => props.$success ? '1rem' : '0'};
  background: ${props => props.$success ? 'rgba(76, 175, 80, 0.1)' : 'transparent'};
  border-radius: ${props => props.$success ? '4px' : '0'};
`;

const PasswordStrength = styled.div`
  height: 4px;
  background: ${props => {
    if (props.$strength === 'strong') return '#4CAF50';
    if (props.$strength === 'medium') return '#FFC107';
    return '#FF5252';
  }};
  transition: all 0.3s;
  margin-top: 0.5rem;
`;

const ResetLink = styled.p`
  color: #c49952;
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const VerificationMessage = styled.div`
  color: #4CAF50;
  text-align: center;
  margin-top: 1rem;
  padding: 1.5rem;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
  margin-bottom: 2rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ErrorText = styled.span`
  color: #ff4444;
  font-size: 0.8rem;
  margin-top: -0.5rem;
`;

const checkPasswordStrength = (pass) => {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
  const mediumRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.{6,})/;

  if (strongRegex.test(pass)) return 'strong';
  if (mediumRegex.test(pass)) return 'medium';
  return 'weak';
};

const Auth = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('weak');
  const [isVerification, setIsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/dashboard', { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    const errors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    if (!isReset) {
      const passwordError = validatePassword(password);
      if (passwordError) errors.password = passwordError;

      if (!isLogin) {
        const confirmError = validatePasswordMatch(password, confirmPassword);
        if (confirmError) errors.confirmPassword = confirmError;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful:', userCredential.user);
        navigate('/dashboard', { replace: true });
      } else {
        // Sign up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setVerificationEmail(email);
        
        // Create user document
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          subscription: 'free',
          createdAt: new Date(),
          limits: {
            pdfUploads: { used: 0, limit: 2 },
            websiteUploads: { used: 0, limit: 1 }
          },
          generationsPerUpload: 1,
          stripeCustomerId: null,
          stripeSubscriptionId: null
        });

        navigate('/verify-email', { replace: true });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, verificationEmail, password);
      await sendEmailVerification(userCredential.user);
      setError('Verification email resent! Check your inbox.');
      setIsSuccess(true);
    } catch (error) {
      setError(error.message);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        // Create/update user document
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          subscription: 'free',
          createdAt: new Date(),
          limits: {
            pdfUploads: { used: 0, limit: 2 },
            websiteUploads: { used: 0, limit: 1 }
          },
          generationsPerUpload: 1,
          stripeCustomerId: null,
          stripeSubscriptionId: null
        }, { merge: true });

        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isVerification) {
    return (
      <AuthContainer>
        <div className="bg-animation">
          <div id="stars"></div>
          <div id="stars2"></div>
          <div id="stars3"></div>
          <div id="stars4"></div>
        </div>
        <AuthCard>
          <Title>Verify Your Email</Title>
          <VerificationMessage>
            We've sent a verification email to {verificationEmail}. 
            Please check your inbox and click the verification link.
          </VerificationMessage>
          <ButtonContainer>
            <Button 
              onClick={handleResendVerification}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </Button>
          </ButtonContainer>
          <ResetLink onClick={() => {
            setIsVerification(false);
            setIsLogin(true);
          }}>
            Back to login
          </ResetLink>
          {error && <ErrorMessage $success={isSuccess}>{error}</ErrorMessage>}
        </AuthCard>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <div className="bg-animation">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div id="stars4"></div>
      </div>
      <BackButton onClick={() => navigate('/')}>
        ← Back to Home
      </BackButton>
      <AuthCard>
        <Title>
          {isReset ? 'Reset Password' : isLogin ? 'Login' : 'Sign Up'}
        </Title>
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFormErrors(prev => ({ ...prev, email: null }));
            }}
            $error={formErrors.email}
            required
          />
          {formErrors.email && (
            <ErrorText>{formErrors.email}</ErrorText>
          )}
          {!isReset && (
            <>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordStrength(checkPasswordStrength(e.target.value));
                }}
                $error={formErrors.password}
                required
              />
              {formErrors.password && (
                <ErrorText>{formErrors.password}</ErrorText>
              )}
              {!isLogin && (
                <>
                  <PasswordStrength $strength={passwordStrength} />
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFormErrors(prev => ({ ...prev, confirmPassword: null }));
                    }}
                    $error={formErrors.confirmPassword}
                    required
                  />
                  {formErrors.confirmPassword && (
                    <ErrorText>{formErrors.confirmPassword}</ErrorText>
                  )}
                </>
              )}
            </>
          )}
          <Button 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Processing...' : 
             isReset ? 'Send Reset Link' :
             isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </Form>
        <ButtonContainer>
          {!isReset && (
            <GoogleButton onClick={handleGoogleSignIn}>
              Sign in with Google
            </GoogleButton>
          )}
          <ToggleText onClick={() => {
            setIsLogin(!isLogin);
            setIsReset(false);
            setError('');
          }}>
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </ToggleText>
          {isLogin && !isReset && (
            <ResetLink onClick={() => {
              setIsReset(true);
              setError('');
            }}>
              Forgot password?
            </ResetLink>
          )}
        </ButtonContainer>
        {isReset && (
          <ResetLink onClick={() => {
            setIsReset(false);
            setError('');
          }}>
            Back to login
          </ResetLink>
        )}
        {error && <ErrorMessage $success={isSuccess}>{error}</ErrorMessage>}
      </AuthCard>
    </AuthContainer>
  );
};

export default Auth; 