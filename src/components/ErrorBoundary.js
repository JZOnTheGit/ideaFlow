import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
  background: #000;
  color: white;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  padding: 20px;
  border-radius: 8px;
  max-width: 600px;
  text-align: center;
`;

const RetryButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  background: #c49952;
  border: none;
  border-radius: 4px;
  color: black;
  cursor: pointer;
  
  &:hover {
    background: #b38a43;
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorMessage>
            <h2>Something went wrong</h2>
            <p>We apologize for the inconvenience. Please try again.</p>
            {process.env.NODE_ENV === 'development' && (
              <pre>{this.state.error?.toString()}</pre>
            )}
          </ErrorMessage>
          <RetryButton onClick={this.handleRetry}>
            Retry
          </RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 