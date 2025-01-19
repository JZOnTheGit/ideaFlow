import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import PDFView from './PDFView';

const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
`;

const PDFList = styled.div`
  width: 100%;
  flex: 1;
  display: grid;
  gap: 1rem;

  @media (max-width: 768px) {
    margin-top: 1rem;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 68, 68, 0.8);
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.3s;
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 1.2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 68, 68, 0.1);
    color: #ff4444;
  }
`;

const PDFCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  margin-bottom: ${props => props.$isSelected ? '2rem' : '1rem'};

  &::after {
    content: '${props => props.$isSelected ? '▼' : '▶'}';
    position: absolute;
    right: 3.5rem;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(196, 153, 82, 0.6);
    transition: all 0.3s;
  }

  &:hover {
    background: rgba(196, 153, 82, 0.1);
    transform: translateY(-2px);

    ${DeleteButton} {
      opacity: 1;
    }
  }

  h3 {
    color: #c49952;
    margin: 0;
    font-size: 1.1rem;
  }

  p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    margin: 0.5rem 0 0 0;
  }
`;

const PDFContent = styled.div`
  max-height: ${props => props.$isOpen ? '2000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0 0 8px 8px;
  margin-top: ${props => props.$isOpen ? '1rem' : '0'};
`;

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999;
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #1a1a1a;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  color: white;
`;

const DialogButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
`;

const DialogButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;

  &.confirm {
    background: #ff4444;
    color: white;

    &:hover {
      background: #ff2222;
    }
  }

  &.cancel {
    background: #333;
    color: white;

    &:hover {
      background: #444;
    }
  }
`;

const History = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPDFs = async () => {
    try {
      setLoading(true);
      if (!auth.currentUser) {
        console.log('No authenticated user');
        return;
      }

      console.log('Fetching PDFs for user:', auth.currentUser.uid);
      const q = query(
        collection(db, 'pdf-contents'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot size:', querySnapshot.size);
      const pdfList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Document data:', data);
        const uploadedAt = data.uploadedAt?.toDate?.() || new Date(data.uploadedAt);
        return {
          id: doc.id,
          ...data,
          uploadedAt: uploadedAt,
          generatedContent: data.generatedContent || {}
        };
      });
      
      console.log('Fetched PDFs:', pdfList);
      setPdfs(pdfList);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      setError('Failed to load PDF history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, [auth.currentUser]);

  const handlePDFClick = (pdf) => {
    setSelectedPDF(selectedPDF?.id === pdf.id ? null : pdf);
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'pdf-contents', id));
      setPdfs(pdfs.filter(pdf => pdf.id !== id));
      if (selectedPDF?.id === id) {
        setSelectedPDF(null);
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
      setError('Failed to delete PDF');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <HistoryContainer>
      <PDFList>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error}</div>
        ) : pdfs.length === 0 ? (
          <div>No PDFs uploaded yet</div>
        ) : (
          pdfs.map((pdf) => (
            <div key={pdf.id}>
              <PDFCard 
                onClick={() => handlePDFClick(pdf)}
                $isSelected={selectedPDF?.id === pdf.id}
              >
                <div>
                  <h3>{pdf.fileName}</h3>
                  <p>{pdf.uploadedAt.toLocaleDateString()} at {pdf.uploadedAt.toLocaleTimeString()}</p>
                </div>
                <DeleteButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(pdf.id);
                  }}
                >
                  ✕
                </DeleteButton>
              </PDFCard>
              <PDFContent $isOpen={selectedPDF?.id === pdf.id}>
                {selectedPDF?.id === pdf.id && (
                  <PDFView pdfData={pdf} />
                )}
              </PDFContent>
            </div>
          ))
        )}
      </PDFList>

      {deleteId && (
        <>
          <DialogOverlay />
          <ConfirmDialog>
            <h3>Delete PDF?</h3>
            <p>Are you sure you want to delete this PDF? This action cannot be undone.</p>
            <DialogButtons>
              <DialogButton 
                className="cancel" 
                onClick={() => setDeleteId(null)}
                disabled={deleting}
              >
                Cancel
              </DialogButton>
              <DialogButton 
                className="confirm" 
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </DialogButton>
            </DialogButtons>
          </ConfirmDialog>
        </>
      )}
    </HistoryContainer>
  );
};

export default History; 