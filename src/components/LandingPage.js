import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import '../styles/stars.css';

const LandingContainer = styled.div`
  min-height: 100vh;
  background: #000;
  color: #ffffff;
  position: relative;
  overflow: hidden;
`;

const HeroSection = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  position: relative;
  z-index: 1;
`;

const Title = styled.h1`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #c49952, #ffe5a0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 800px;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const CTAButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background: #c49952;
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  margin: 0.5rem;

  &:hover {
    background: #b38a43;
    transform: translateY(-2px);
  }
`;

const Features = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 4rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-5px);
  }
`;

const FeatureTitle = styled.h3`
  color: #c49952;
  margin-bottom: 1rem;
`;

const NavBar = styled.nav`
  position: fixed;
  top: 0;
  right: 0;
  padding: 2rem;
  z-index: 2;
`;

const SignInButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: #c49952;
  border: 2px solid #c49952;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(196, 153, 82, 0.1);
    transform: translateY(-2px);
  }
`;

const PricingSection = styled.div`
  padding: 4rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  text-align: center;
  position: relative;
  z-index: 1;
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 2rem auto;
`;

const PricingCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 8px;
  border: ${props => props.$featured ? '2px solid #c49952' : '1px solid rgba(255, 255, 255, 0.1)'};
  position: relative;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-5px);
  }
`;

const PlanName = styled.h3`
  color: #c49952;
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const PlanPrice = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: white;
`;

const PlanFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 2rem 0;
  text-align: left;

  li {
    margin-bottom: 0.5rem;
    padding-left: 1.5rem;
    position: relative;

    &:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #c49952;
    }
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <LandingContainer>
      <div className="bg-animation">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div id="stars4"></div>
      </div>
      <NavBar>
        <SignInButton onClick={() => navigate('/login')}>
          Sign In
        </SignInButton>
      </NavBar>
      <HeroSection>
        <Title>IdeaFlow</Title>
        <Subtitle>
          Turn your PDFs and articles into engaging social media content with the power of AI
        </Subtitle>
        <div>
          <CTAButton onClick={() => navigate('/login')}>Get Started</CTAButton>
        </div>
      </HeroSection>

      <Features>
        <FeatureCard>
          <FeatureTitle>PDF Processing</FeatureTitle>
          <p>Upload your PDFs and let our AI extract and analyze the content</p>
        </FeatureCard>
        <FeatureCard>
          <FeatureTitle>Multi-Platform Content</FeatureTitle>
          <p>Generate content optimized for Twitter, YouTube, and TikTok</p>
        </FeatureCard>
        <FeatureCard>
          <FeatureTitle>Website Integration</FeatureTitle>
          <p>Process content directly from website URLs</p>
        </FeatureCard>
      </Features>

      <PricingSection>
        <Title>Choose Your Plan</Title>
        <PricingGrid>
          <PricingCard>
            <PlanName>Free</PlanName>
            <PlanPrice>£0</PlanPrice>
            <PlanFeatures>
              <li>2 PDF uploads per day</li>
              <li>1 website URL processing per day</li>
              <li>1 generation per upload</li>
              <li>Basic AI content generation</li>
            </PlanFeatures>
            <CTAButton onClick={() => navigate('/signup')}>
              Get Started
            </CTAButton>
          </PricingCard>
          
          <PricingCard $featured>
            <PlanName>Pro</PlanName>
            <PlanPrice>£15/month</PlanPrice>
            <PlanFeatures>
              <li>80 PDF uploads</li>
              <li>50 website processing</li>
              <li>3 generations per upload</li>
              <li>Advanced AI content generation</li>
              <li>Priority support</li>
              <li>Early access to new features</li>
            </PlanFeatures>
            <CTAButton onClick={() => navigate('/signup')} style={{ background: '#c49952' }}>
              Upgrade to Pro
            </CTAButton>
          </PricingCard>
        </PricingGrid>
      </PricingSection>
    </LandingContainer>
  );
};

export default LandingPage; 