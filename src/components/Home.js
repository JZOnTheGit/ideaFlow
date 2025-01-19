import React from 'react';
import styled from 'styled-components';
import PDFUpload from './PDFUpload';

const Container = styled.div`
  padding: 2rem;
`;

const Title = styled.h1`
  color: #ffffff;
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const Home = () => {
  return (
    <Container>
      <Title>Content Generator</Title>
      <PDFUpload />
    </Container>
  );
};

export default Home; 