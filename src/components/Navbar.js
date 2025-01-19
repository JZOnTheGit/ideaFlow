import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { auth } from '../firebase/firebase';
import {
  CloudUpload as UploadIcon,
  History as HistoryIcon,
  CreditCard as SubscriptionIcon,
  Settings as SettingsIcon,
  ExitToApp as SignOutIcon
} from '@mui/icons-material';

const Nav = styled.div`
  background: rgba(0, 0, 0, 0.3);
  width: 250px;
  height: 100vh;
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s;
  background: ${props => props.$active ? 'rgba(196, 153, 82, 0.1)' : 'transparent'};
  font-size: 1.1rem;

  &:hover {
    background: rgba(196, 153, 82, 0.1);
  }

  .MuiSvgIcon-root {
    margin-right: 1rem;
    width: 24px;
    height: 24px;
  }
`;

const SignOutButton = styled(NavItem)`
  margin-top: auto;
  color: #ff4444;

  &:hover {
    background: rgba(255, 68, 68, 0.1);
  }
`;

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Nav>
      <NavItem onClick={() => navigate('/dashboard')}>
        <UploadIcon /> Upload
      </NavItem>
      <NavItem onClick={() => navigate('/dashboard/history')}>
        <HistoryIcon /> History
      </NavItem>
      <NavItem onClick={() => navigate('/dashboard/subscription')}>
        <SubscriptionIcon /> Subscription
      </NavItem>
      <NavItem onClick={() => navigate('/dashboard/settings')}>
        <SettingsIcon /> Settings
      </NavItem>
      <SignOutButton onClick={handleLogout}>
        <SignOutIcon /> Sign Out
      </SignOutButton>
    </Nav>
  );
};

export default Navbar; 