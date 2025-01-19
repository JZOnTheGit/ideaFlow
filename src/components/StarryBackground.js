import styled from 'styled-components';

const StarsContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
`;

const createStars = (size, count, color = '#c49952', duration = '50s') => styled.div`
  width: ${size}px;
  height: ${size}px;
  background: transparent;
  box-shadow: ${Array(count).fill().map(() => {
    const x = Math.floor(Math.random() * 2000);
    const y = Math.floor(Math.random() * 2000);
    return `${x}px ${y}px ${color}`;
  }).join(', ')};
  animation: animStar ${duration} linear infinite;

  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: ${size}px;
    height: ${size}px;
    background: transparent;
    box-shadow: ${Array(count).fill().map(() => {
      const x = Math.floor(Math.random() * 2000);
      const y = Math.floor(Math.random() * 2000);
      return `${x}px ${y}px ${color}`;
    }).join(', ')};
  }

  @keyframes animStar {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-2000px);
    }
  }
`;

const Stars1 = createStars(1, 50);
const Stars2 = createStars(2, 30, '#c49952', '100s');
const Stars3 = createStars(3, 20, '#c49952', '150s');
const Stars4 = createStars(1, 40, '#c49952', '600s');

const StarryBackground = () => {
  return (
    <StarsContainer className="bg-animation">
      <Stars1 id="stars" />
      <Stars2 id="stars2" />
      <Stars3 id="stars3" />
      <Stars4 id="stars4" />
    </StarsContainer>
  );
};

export default StarryBackground; 