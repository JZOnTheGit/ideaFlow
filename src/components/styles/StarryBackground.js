import styled, { keyframes } from 'styled-components';

const moveStars = keyframes`
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-2000px);
  }
`;

export const StarContainer = styled.div`
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(circle at center, 
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.95) 100%
  );
`;

const createStarField = (n) => {
  let styles = '';
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 100;
    const y = Math.random() * 2000;
    const size = Math.random() * 2 + 0.5;
    const opacity = Math.random() * 0.8 + 0.4;
    styles += `
      &:nth-child(${i + 1}) {
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        top: ${y}px;
        left: ${x}%;
        background: rgba(255, 255, 255, ${opacity});
        border-radius: 50%;
        box-shadow: 0 0 ${size * 3}px ${size}px rgba(255, 255, 255, ${opacity * 0.8});
      }
    `;
  }
  return styles;
};

export const StarField = styled.div`
  position: absolute;
  width: 100%;
  height: 2000px;
  animation: ${moveStars} 80s linear infinite;
  will-change: transform;
  pointer-events: none;

  div {
    pointer-events: none;
    ${props => createStarField(props.count || 200)}
  }
`; 