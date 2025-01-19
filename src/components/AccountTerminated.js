import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h1`
  color: #c49952;
  margin-bottom: 1.5rem;
  font-size: 2rem;
`;

const Message = styled.p`
  color: #ffffff;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  background: #c49952;
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;

  &:hover {
    background: #b38a43;
  }
`;

const AccountTerminated = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <Container>
      <div className="bg-animation">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div id="stars4"></div>
      </div>
      <Card>
        <Title>Account Terminated</Title>
        <Message>
          Your account has been successfully terminated. All your data has been deleted.
          Thank you for using our service.
        </Message>
        <ButtonContainer>
          <Button onClick={handleBackToHome}>
            Return to Home
          </Button>
        </ButtonContainer>
      </Card>
    </Container>
  );
};

export default AccountTerminated; 