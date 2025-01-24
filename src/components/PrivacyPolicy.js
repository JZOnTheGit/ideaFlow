import React from 'react';
import styled from 'styled-components';
import '../styles/stars.css';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  position: relative;
  min-height: 100vh;
  background: #000;
  color: #fff;
  overflow-x: hidden;
  padding: 4rem 2rem;

  .bg-animation {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.05);
  padding: 3rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(196, 153, 82, 0.2);
`;

const Title = styled.h1`
  color: #c49952;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #c49952, #ffe5a0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Section = styled.section`
  margin-bottom: 2rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(196, 153, 82, 0.1);
`;

const SubTitle = styled.h2`
  color: #c49952;
  margin: 1.5rem 0;
  font-size: 1.8rem;
`;

const Text = styled.p`
  margin-bottom: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
`;

const List = styled.ul`
  margin: 1rem 0;
  padding-left: 2rem;
  
  li {
    margin-bottom: 0.5rem;
    color: rgba(255, 255, 255, 0.9);
    position: relative;
    padding-left: 0.5rem;
    
    &::marker {
      color: #c49952;
    }
  }
`;

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

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <BackButton onClick={() => navigate('/')}>← Back to Home</BackButton>
      <div className="bg-animation">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div id="stars4"></div>
      </div>
      <ContentWrapper>
        <Title>Privacy Policy</Title>

        <Section>
          <SubTitle>1. Information We Collect</SubTitle>
          <Text>We collect the following types of information:</Text>
          <List>
            <li>Account information (email, password)</li>
            <li>Usage data (uploads, generations)</li>
            <li>Payment information (processed by Stripe)</li>
            <li>Content you upload (PDFs, website URLs)</li>
          </List>
        </Section>

        <Section>
          <SubTitle>2. How We Use Your Information</SubTitle>
          <Text>Your information is used to:</Text>
          <List>
            <li>Provide and improve our services</li>
            <li>Process payments</li>
            <li>Monitor usage limits</li>
            <li>Send service updates</li>
            <li>Generate AI content</li>
          </List>
        </Section>

        <Section>
          <SubTitle>3. Data Storage</SubTitle>
          <Text>
            We use Firebase to store your data securely. Your content is processed and stored in accordance with industry standards.
          </Text>
        </Section>

        <Section>
          <SubTitle>4. Payment Processing</SubTitle>
          <Text>
            All payments are processed by Stripe. We do not store your payment information directly.
          </Text>
        </Section>

        <Section>
          <SubTitle>5. Data Retention</SubTitle>
          <Text>
            We retain your data for as long as your account is active. You can request data deletion by contacting us.
          </Text>
        </Section>

        <Section>
          <SubTitle>6. Security</SubTitle>
          <Text>
            We implement security measures including:
          </Text>
          <List>
            <li>Secure Firebase Authentication</li>
            <li>Protected API endpoints</li>
            <li>Data encryption</li>
            <li>Regular security audits</li>
          </List>
        </Section>

        <Section>
          <SubTitle>7. Contact Us</SubTitle>
          <Text>
            For privacy-related questions, please contact: jass150505@gmail.com
          </Text>
        </Section>
      </ContentWrapper>
    </Container>
  );
};

export default PrivacyPolicy; 