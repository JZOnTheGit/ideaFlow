import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebase';
import styled from 'styled-components';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
  verifyBeforeUpdateEmail
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  collection,
  getDocs,
  where
} from 'firebase/firestore';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

const compressImage = async (base64Str, maxWidth = 100) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

const SettingsContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  color: #ffffff;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #ffffff;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #ffffff;
  font-size: 1rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #c49952;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: #c49952;
  color: #000000;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-right: 1rem;

  &:hover {
    background: #b38a43;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const ProfilePictureContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ProfileImage = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #c49952;
  background: rgba(255, 255, 255, 0.1);
`;

const ProfilePictureInput = styled.input`
  display: none;
`;

const ProfilePictureLabel = styled.label`
  padding: 0.75rem 1.5rem;
  background: #c49952;
  color: black;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #b38a43;
  }
`;

const ErrorMessage = styled.p`
  color: #ff4444;
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.p`
  color: #4CAF50;
  margin-bottom: 1rem;
`;

const PasswordContainer = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 1rem;
`;

const PasswordToggle = styled.span`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  user-select: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.2rem;
  transition: color 0.3s;

  &:hover {
    color: rgba(255, 255, 255, 0.8);
  }
`;

const ValidationMessage = styled.p`
  color: ${props => props.$isError ? '#ff4444' : '#4CAF50'};
  font-size: 0.8rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
`;

const DangerSection = styled(Section)`
  border: 1px solid rgba(255, 68, 68, 0.3);
  background: rgba(255, 68, 68, 0.1);
`;

const DangerButton = styled(Button)`
  background: #ff4444;
  color: white;

  &:hover {
    background: #ff0000;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  text-align: center;
`;

const ModalTitle = styled.h3`
  color: #ff4444;
  margin-bottom: 1rem;
`;

const Settings = () => {
  const [emailFormPassword, setEmailFormPassword] = useState('');
  const [passwordFormCurrentPassword, setPasswordFormCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [displayPicture, setDisplayPicture] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    number: false,
    lowercase: false,
    uppercase: false
  });
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminatePassword, setTerminatePassword] = useState('');
  const [messages, setMessages] = useState({
    profile: { error: '', success: '' },
    email: { error: '', success: '' },
    password: { error: '', success: '' },
    terminate: { error: '', success: '' }
  });
  const { subscription } = useSubscription();
  const [confirmSubscriptionCancel, setConfirmSubscriptionCancel] = useState(false);
  const navigate = useNavigate();

  const setMessage = (section, type, message) => {
    setMessages(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [type]: message
      }
    }));
  };

  useEffect(() => {
    const loadProfilePicture = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists() && userDoc.data().profilePicture) {
            setProfilePicture(userDoc.data().profilePicture);
            setDisplayPicture(userDoc.data().profilePicture);
          }
        } catch (error) {
          console.error('Error loading profile picture:', error);
        }
      }
    };

    loadProfilePicture();
  }, []);

  const handleReauthenticate = async (password, section) => {
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      setMessage(section, 'error', 'Current password is incorrect');
      return false;
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setMessage('email', 'error', '');
    setMessage('email', 'success', '');

    try {
      if (!newEmail) {
        setMessage('email', 'error', 'Please enter a new email address');
        return;
      }

      if (!emailFormPassword) {
        setMessage('email', 'error', 'Please enter your current password');
        return;
      }

      if (await handleReauthenticate(emailFormPassword, 'email')) {
        const actionCodeSettings = {
          url: window.location.origin + '/settings',
          handleCodeInApp: true
        };

        await verifyBeforeUpdateEmail(auth.currentUser, newEmail, actionCodeSettings);
        
        setMessage('email', 'success', 
          `A verification email has been sent to ${newEmail}. Please check your email and verify it before the change takes effect.`
        );
        
        setNewEmail('');
        setEmailFormPassword('');
      }
    } catch (error) {
      console.error('Email update error:', error);
      let errorMessage = 'An error occurred while updating email';

      switch (error.code) {
        case 'auth/requires-recent-login':
          errorMessage = 'Please sign in again before updating your email';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use by another account';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect';
          break;
        default:
          errorMessage = error.message;
      }
      setMessage('email', 'error', errorMessage);
    }
  };

  const validatePassword = (password) => {
    setPasswordValidation({
      length: password.length >= 6,
      number: /\d/.test(password),
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password)
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('password', 'error', '');
    setMessage('password', 'success', '');

    try {
      if (!passwordFormCurrentPassword) {
        setMessage('password', 'error', 'Please enter your current password');
        return;
      }

      if (!newPassword) {
        setMessage('password', 'error', 'Please enter a new password');
        return;
      }

      const isValid = Object.values(passwordValidation).every(v => v);
      if (!isValid) {
        setMessage('password', 'error', 'Please ensure your password meets all requirements');
        return;
      }

      if (await handleReauthenticate(passwordFormCurrentPassword, 'password')) {
        await updatePassword(auth.currentUser, newPassword);
        setMessage('password', 'success', 'Password updated successfully');
        setNewPassword('');
        setPasswordFormCurrentPassword('');
        setPasswordValidation({
          length: false,
          number: false,
          lowercase: false,
          uppercase: false
        });
      }
    } catch (error) {
      console.error('Password update error:', error);
      let errorMessage = 'An error occurred while updating password';

      switch (error.code) {
        case 'auth/requires-recent-login':
          errorMessage = 'Please sign in again before updating your password';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak. Please choose a stronger password';
          break;
        default:
          errorMessage = error.message;
      }
      setMessage('password', 'error', errorMessage);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setMessage('profile', 'error', '');
      setMessage('profile', 'success', '');

      // Validate file size (max 2MB for base64)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size too large. Please upload an image 2MB or below');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Convert image to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Create a highly compressed version for auth profile
      const compressedImage = await compressImage(base64, 32);
      
      // Update auth profile with compressed version
      await updateProfile(auth.currentUser, {
        photoURL: compressedImage
      });

      // Save full quality image to Firestore
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        profilePicture: base64
      }, { merge: true });

      setProfilePicture(base64);
      setDisplayPicture(base64);
      setMessage('profile', 'success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('profile', 'error', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelSubscriptionAndTerminate = async (e) => {
    e.preventDefault(); // Prevent form submission
    try {
      // First verify the password
      if (!await handleReauthenticate(terminatePassword, 'terminate')) {
        return;
      }

      // Cancel subscription in Stripe first
      const response = await fetch(`${process.env.REACT_APP_API_URL}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      console.log('Subscription cancelled, proceeding with account termination');

      // Then proceed with account termination
      try {
        // First delete all PDF documents
        const pdfQuery = query(
          collection(db, 'pdf-contents'),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(pdfQuery);
        
        console.log('Deleting PDF documents...');
        await Promise.all(
          querySnapshot.docs.map(doc => deleteDoc(doc.ref))
        );
        
        console.log('Deleting user data...');
        // Then delete user data from Firestore
        await deleteDoc(doc(db, 'users', auth.currentUser.uid));
        
        console.log('Deleting user account...');
        // Finally delete the user account
        await auth.currentUser.delete();
        
        console.log('Navigating to terminated page...');
        // Navigate to terminated page
        navigate('/account-terminated', { replace: true });
      } catch (error) {
        console.error('Error during termination:', error);
        throw new Error('Failed to terminate account: ' + error.message);
      }
    } catch (error) {
      console.error('Error in subscription cancellation:', error);
      setMessage('terminate', 'error', 'Failed to cancel subscription: ' + error.message);
    }
  };

  const handleTerminateAccount = async (e) => {
    if (e) e.preventDefault();
    setMessage('terminate', 'error', '');

    try {
      if (await handleReauthenticate(terminatePassword, 'terminate')) {
        // Check if user has active subscription and hasn't confirmed cancellation
        if (subscription === 'pro' && !confirmSubscriptionCancel) {
          setMessage('terminate', 'error', 'Please confirm subscription cancellation');
          return;
        }

        // First delete all PDF documents
        try {
          const pdfQuery = query(
            collection(db, 'pdf-contents'),
            where('userId', '==', auth.currentUser.uid)
          );
          const querySnapshot = await getDocs(pdfQuery);
          
          await Promise.all(
            querySnapshot.docs.map(doc => deleteDoc(doc.ref))
          );
          
          console.log(`Deleted ${querySnapshot.size} PDF documents`);
        } catch (error) {
          console.error('Error deleting PDF documents:', error);
          throw new Error('Failed to delete user content. Please try again.');
        }

        // Then delete user data from Firestore
        try {
          await deleteDoc(doc(db, 'users', auth.currentUser.uid));
        } catch (firestoreError) {
          console.error('Error deleting user data:', firestoreError);
          throw new Error('Failed to delete user data. Please try again.');
        }

        // Finally delete the user account
        await auth.currentUser.delete();
        navigate('/account-terminated');
      }
    } catch (error) {
      console.error('Account termination error:', error);
      setMessage('terminate', 'error', 'Failed to terminate account: ' + error.message);
    }
  };

  return (
    <SettingsContainer>
      <Section>
        <SectionTitle>Profile Settings</SectionTitle>
        <ProfilePictureContainer>
          <ProfileImage 
            src={displayPicture || auth.currentUser?.photoURL || '/default-avatar.png'} 
            alt="Profile" 
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
          <ProfilePictureLabel>
            {isUploading ? 'Uploading...' : 'Change Profile Picture'}
            <ProfilePictureInput
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              disabled={isUploading}
            />
          </ProfilePictureLabel>
        </ProfilePictureContainer>
        {messages.profile.error && <ErrorMessage>{messages.profile.error}</ErrorMessage>}
        {messages.profile.success && <SuccessMessage>{messages.profile.success}</SuccessMessage>}
      </Section>

      <Section>
        <SectionTitle>Change Email</SectionTitle>
        <form onSubmit={handleEmailChange}>
          <Input
            type="email"
            placeholder="New Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Current Password"
            value={emailFormPassword}
            onChange={(e) => setEmailFormPassword(e.target.value)}
          />
          <Button type="submit">Update Email</Button>
        </form>
        {messages.email.error && <ErrorMessage>{messages.email.error}</ErrorMessage>}
        {messages.email.success && <SuccessMessage>{messages.email.success}</SuccessMessage>}
      </Section>

      <Section>
        <SectionTitle>Change Password</SectionTitle>
        <form onSubmit={handlePasswordChange}>
          <PasswordContainer>
            <Input
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Current Password"
              value={passwordFormCurrentPassword}
              onChange={(e) => setPasswordFormCurrentPassword(e.target.value)}
            />
            <PasswordToggle onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
              {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
            </PasswordToggle>
          </PasswordContainer>

          <PasswordContainer>
            <Input
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                validatePassword(e.target.value);
              }}
            />
            <PasswordToggle onClick={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? "👁️" : "👁️‍🗨️"}
            </PasswordToggle>
          </PasswordContainer>

          {newPassword && (
            <div style={{ marginBottom: '1rem' }}>
              <ValidationMessage $isError={!passwordValidation.length}>
                ✓ At least 6 characters
              </ValidationMessage>
              <ValidationMessage $isError={!passwordValidation.number}>
                ✓ Contains a number
              </ValidationMessage>
              <ValidationMessage $isError={!passwordValidation.lowercase}>
                ✓ Contains a lowercase letter
              </ValidationMessage>
              <ValidationMessage $isError={!passwordValidation.uppercase}>
                ✓ Contains an uppercase letter
              </ValidationMessage>
            </div>
          )}

          <Button type="submit">Update Password</Button>
        </form>
        {messages.password.error && <ErrorMessage>{messages.password.error}</ErrorMessage>}
        {messages.password.success && <SuccessMessage>{messages.password.success}</SuccessMessage>}
      </Section>

      <DangerSection>
        <SectionTitle style={{ color: '#ff4444' }}>Terminate Account</SectionTitle>
        <p style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
          Warning: This action cannot be undone. All your data will be permanently deleted.
        </p>
        <DangerButton onClick={() => setShowTerminateModal(true)}>
          Terminate Account
        </DangerButton>
      </DangerSection>

      {showTerminateModal && (
        <Modal>
          <ModalContent>
            <ModalTitle>Terminate Account</ModalTitle>
            <p style={{ marginBottom: '1rem' }}>
              Are you sure you want to terminate your account? This action cannot be undone.
            </p>
            {subscription === 'pro' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={confirmSubscriptionCancel}
                    onChange={(e) => setConfirmSubscriptionCancel(e.target.checked)}
                  />
                  I understand this will cancel my Pro subscription
                </label>
              </div>
            )}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (subscription === 'pro') {
                handleCancelSubscriptionAndTerminate(e);
              } else {
                handleTerminateAccount(e);
              }
            }}>
              <Input
                type="password"
                placeholder="Enter your password to confirm"
                value={terminatePassword}
                onChange={(e) => setTerminatePassword(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Button type="button" onClick={() => {
                  setShowTerminateModal(false);
                  setTerminatePassword('');
                  setConfirmSubscriptionCancel(false);
                }}>
                  Cancel
                </Button>
                <DangerButton 
                  type="submit"
                  disabled={subscription === 'pro' && !confirmSubscriptionCancel}
                >
                  Confirm Termination
                </DangerButton>
              </div>
            </form>
          </ModalContent>
          {messages.terminate.error && <ErrorMessage>{messages.terminate.error}</ErrorMessage>}
        </Modal>
      )}
    </SettingsContainer>
  );
};

export default Settings; 