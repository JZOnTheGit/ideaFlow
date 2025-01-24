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

const TermsOfService = () => {
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
        <Title>Terms of Service</Title>
        
        <Section>
          <SubTitle>1. Acceptance of Terms</SubTitle>
          <Text>
            By accessing and using IdeaFlow ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </Text>
        </Section>

        <Section>
          <SubTitle>2. Service Description</SubTitle>
          <Text>
            IdeaFlow is an AI-powered content generation platform that transforms PDF documents and website content into social media content. The service includes:
          </Text>
          <List>
            <li>PDF document processing</li>
            <li>Website content extraction</li>
            <li>AI-powered content generation</li>
            <li>Social media content optimization</li>
          </List>
        </Section>

        <Section>
          <SubTitle>3. User Accounts</SubTitle>
          <Text>
            Users must register for an account to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
          </Text>
        </Section>

        <Section>
          <SubTitle>4. Subscription and Payments</SubTitle>
          <Text>
            The Service offers free and paid subscription tiers. Paid subscriptions are billed monthly through Stripe. Cancellations will take effect immediately.
          </Text>
        </Section>

        <Section>
          <SubTitle>5. Usage Limits</SubTitle>
          <Text>
            Free tier users are limited to:
          </Text>
          <List>
            <li>2 PDF uploads per day</li>
            <li>1 website link per day</li>
            <li>1 generation per content type</li>
          </List>
          <Text>
            Pro tier users receive:
          </Text>
          <List>
            <li>80 PDF uploads per month</li>
            <li>50 website uploads per month</li>
            <li>3 generations per content type</li>
          </List>
        </Section>

        <Section>
          <SubTitle>6. Content Guidelines</SubTitle>
          <Text>
            Users are responsible for ensuring they have the right to use and process any content uploaded to the Service. Prohibited content includes illegal, harmful, or infringing materials.
          </Text>
        </Section>

        <Section>
          <SubTitle>7. Termination</SubTitle>
          <Text>
            We reserve the right to terminate or suspend access to the Service for violations of these terms or for any other reason at our discretion.
          </Text>
        </Section>

        <Section>
          <SubTitle>8. Contact</SubTitle>
          <Text>
            For questions about these terms, please contact: jass150505@gmail.com
          </Text>
        </Section>
      </ContentWrapper>
    </Container>
  );
};

export default TermsOfService; 