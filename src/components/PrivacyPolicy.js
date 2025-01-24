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

const PrivacyPolicy = () => {
  return (
    <Container>
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
    </Container>
  );
};

export default PrivacyPolicy; 