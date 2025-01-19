import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import styled from 'styled-components';
import Navbar from './Navbar';

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #000000;
  position: relative;
`;

const Sidebar = styled.div`
  width: ${props => props.$isOpen ? '250px' : '0'};
  background: rgba(255, 255, 255, 0.05);
  padding: ${props => props.$isOpen ? '2rem' : '0'};
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  transition: all 0.3s ease;
  z-index: 100;
  overflow: hidden;

  @media (max-width: 768px) {
    position: fixed;
    transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
    width: 250px;
    padding: 2rem;
  }
`;

const MenuItem = styled.div`
  padding: 1rem;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 4px;
  display: flex;
  align-items: center;

  &:hover {
    background: rgba(196, 153, 82, 0.2);
  }

  &.active {
    background: rgba(196, 153, 82, 0.3);
  }
`;

const SignOutButton = styled(MenuItem)`
  margin-top: auto;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  color: #ff4444;

  &:hover {
    background: rgba(255, 68, 68, 0.2);
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  margin-left: ${props => props.$sidebarOpen ? '250px' : '0'};
  transition: margin-left 0.3s ease;

  @media (max-width: 768px) {
    margin-left: 0;
    padding-top: 4rem;
  }
`;

const MenuButton = styled.button`
  display: none;
  position: fixed;
  top: 1rem;
  left: 1rem;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 101;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    display: block;
  }
`;

const Overlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;

  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'block' : 'none'};
  }
`;

const TopBar = styled.div`
  position: sticky;
  top: 0;
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  z-index: 98;
`;

const ProfileButton = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-image: url(${props => props.$imageUrl || ''});
  background-size: cover;
  background-position: center;
  background-color: #333;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid rgba(196, 153, 82, 0.3);
  position: relative;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(196, 153, 82, 0.2);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(196, 153, 82, 0.3);
  border-radius: 8px;
  width: 200px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.$isOpen ? '0' : '-10px'});
  transition: all 0.3s ease;
`;

const DropdownItem = styled.div`
  padding: 1rem;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background: rgba(196, 153, 82, 0.2);
  }

  &.danger {
    color: #ff4444;
    &:hover {
      background: rgba(255, 68, 68, 0.2);
    }
  }
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding-bottom: 1rem;
`;

const MainContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const ContentArea = styled.div`
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
`;

const Dashboard = () => {
  return (
    <DashboardContainer>
      <Navbar />
      <ContentArea>
        <Outlet />
      </ContentArea>
    </DashboardContainer>
  );
};

export default Dashboard;