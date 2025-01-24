import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: #fff;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #c49952;
  margin-bottom: 2rem;
`;

const SubTitle = styled.h2`
  color: #c49952;
  margin: 1.5rem 0;
`;

const Text = styled.p`
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const List = styled.ul`
  margin: 1rem 0;
  padding-left: 2rem;
  
  li {
    margin-bottom: 0.5rem;
  }
`;

const TermsOfService = () => {
  return (
    <Container>
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
    </Container>
  );
};

export default TermsOfService; 