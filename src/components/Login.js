import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  // ... existing styles
`;

const Form = styled.form`
  // ... existing styles
`;

const TermsText = styled.p`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 1rem;
  text-align: center;
`;

const TermsLink = styled.a`
  color: #c49952;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Login = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    // Handle form submission
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        // ... existing form elements
        <Button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
        <TermsText>
          By signing in, you agree to our{' '}
          <TermsLink href="/terms" target="_blank">Terms of Service</TermsLink>{' '}
          and{' '}
          <TermsLink href="/privacy" target="_blank">Privacy Policy</TermsLink>
        </TermsText>
      </Form>
    </Container>
  );
};

export default Login; 