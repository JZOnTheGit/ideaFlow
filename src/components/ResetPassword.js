import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import styled from 'styled-components';
import '../styles/stars.css';

const ResetContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
`;

const ResetCard = styled.div`
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
  margin-bottom: 1rem;
  font-size: 1.8rem;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-bottom: 2rem;
  font-size: 0.9rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.8rem;
  border-radius: 4px;
  border: 1px solid rgba(196, 153, 82, 0.3);
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
  margin-top: 1rem;

  &:hover {
    background: #b38a43;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
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

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('weak');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const oobCode = searchParams.get('oobCode');
    if (!oobCode) {
      setMessage('Invalid password reset link');
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(email => setEmail(email))
      .catch(() => {
        setMessage('Password reset link has expired');
      });
  }, [searchParams]);

  const checkPasswordStrength = (pass) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    const mediumRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.{6,})/;

    if (strongRegex.test(pass)) return 'strong';
    if (mediumRegex.test(pass)) return 'medium';
    return 'weak';
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (passwordStrength === 'weak') {
      setMessage('Password is too weak. Include uppercase, lowercase, numbers, and special characters.');
      return;
    }

    const oobCode = searchParams.get('oobCode');
    if (!oobCode) {
      setMessage('Invalid password reset link');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setMessage('Password has been reset successfully!');
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setMessage(error.message);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResetContainer>
      <div className="stars"></div>
      <div className="twinkling"></div>
      <ResetCard>
        <Title>Reset your password</Title>
        {email && <Subtitle>for {email}</Subtitle>}
        <Form onSubmit={handleSubmit}>
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          <PasswordStrength $strength={passwordStrength} />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Save'}
          </Button>
        </Form>
        {message && <Message $success={isSuccess}>{message}</Message>}
      </ResetCard>
    </ResetContainer>
  );
};

export default ResetPassword; 