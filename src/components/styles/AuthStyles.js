import styled from 'styled-components';

export const AuthContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #000000;
  color: #ffffff;
  position: relative;
  overflow: hidden;
`;

export const AuthForm = styled.form`
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  box-sizing: border-box;
`;

export const Title = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 400;
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid #333;
  color: #ffffff;
  font-size: 1rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-bottom-color: #ffffff;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

export const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #ffffff;
  color: #000000;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 1rem;
  box-sizing: border-box;

  &:hover {
    background-color: #e6e6e6;
  }
`;

export const LinkContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

export const StyledLink = styled.a`
  color: #ffffff;
  text-decoration: none;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const GlowContainer = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  &:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.05) 35%,
      rgba(255, 255, 255, 0) 70%
    );
    z-index: -1;
  }
`; 