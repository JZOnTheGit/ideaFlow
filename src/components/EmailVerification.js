import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import '../styles/stars.css';

const VerificationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
`;

const VerificationCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`;

const Title = styled.h2`
  color: #c49952;
  margin-bottom: 1rem;
  font-size: 1.8rem;
`;

const Message = styled.p`
  color: white;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const Button = styled.button`
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 4px;
  background: #c49952;
  color: black;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;

  &:hover {
    background: #b38a43;
    transform: translateY(-2px);
  }
`;

const EmailVerification = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <VerificationContainer>
      <div className="stars"></div>
      <div className="twinkling"></div>
      <VerificationCard>
        <Title>
          Check Your Email
        </Title>
        <Message>
          We've sent a verification link to your email address. 
          Please check your inbox and click the link to verify your account.
          <br /><br />
          Once verified, you can log in to access your account.
        </Message>
        <Button onClick={handleBackToLogin}>
          Return to Login
        </Button>
      </VerificationCard>
    </VerificationContainer>
  );
};

export default EmailVerification; 