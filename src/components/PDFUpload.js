import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { collection, addDoc, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { generateContent } from '../services/aiService';
import { useSubscription } from '../contexts/SubscriptionContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Import PDF.js properly
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// Set worker
GlobalWorkerOptions.workerSrc = pdfjsWorker;

const UploadContainer = styled.div`
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 2rem;
`;

const DropZone = styled.div`
  border: 2px dashed rgba(196, 153, 82, 0.3);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: ${props => props.$isDragging ? 'rgba(196, 153, 82, 0.1)' : 'transparent'};

  &:hover {
    background: rgba(196, 153, 82, 0.1);
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #c49952;
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;

  &:hover {
    background: #b38a43;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  margin-top: 1rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: #4CAF50;
  margin-top: 1rem;
  text-align: center;
  padding: 0.5rem;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
`;

const UploadButton = styled(ActionButton)`
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  font-size: 1rem;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  margin-top: 1rem;
`;

const FileName = styled.span`
  color: #ffffff;
  margin-right: 1rem;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.2rem;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.1);
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  border-top-color: #000000;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: #c49952;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 1;

  &:hover {
    background: rgba(196, 153, 82, 0.1);
  }
`;

const ContentCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2.5rem;
  position: relative;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CardTitle = styled.h2`
  color: #c49952;
  margin-bottom: 1rem;
  font-size: 1.5rem;

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-top: 1.5rem;
  position: relative;
  padding: 1rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  
  &::before {
    content: '';
    position: absolute;
    top: -18px;
    left: -18px;
    right: -18px;
    bottom: -18px;
    border: 2px solid rgba(196, 153, 82, 0.1);
    border-radius: 16px;
    z-index: -2;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ContentItemCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  height: 100%;
  border: 1px solid ${props => {
    switch (props.$type) {
      case 'twitter': return 'rgba(29, 161, 242, 0.3)';
      case 'tiktok': return 'rgba(255, 0, 80, 0.3)';
      case 'youtube': return 'rgba(255, 0, 0, 0.3)';
      default: return 'rgba(196, 153, 82, 0.3)';
    }
  }};
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
  min-height: 180px;
  max-height: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border-width: 2px;
  }

  @media (max-width: 768px) {
    min-height: 160px;
    max-height: 200px;
  }
`;

const ContentText = styled.div`
  margin-top: 2.5rem;
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
  font-size: 0.9rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(196, 153, 82, 0.3);
    border-radius: 3px;
  }

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const UploadTypeSwitch = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
`;

const SwitchButton = styled.button`
  background: ${props => props.$active ? '#c49952' : 'rgba(196, 153, 82, 0.1)'};
  color: ${props => props.$active ? 'black' : '#c49952'};
  border: 1px solid #c49952;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: ${props => props.$active ? '#b38a43' : 'rgba(196, 153, 82, 0.2)'};
  }
`;

const URLInput = styled.input`
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(196, 153, 82, 0.3);
  border-radius: 8px;
  color: white;
  margin-bottom: 1rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #c49952;
    background: rgba(196, 153, 82, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const PDFUpload = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [generating, setGenerating] = useState({
    twitter: false,
    youtube: false,
    tiktok: false
  });
  const [generatedContent, setGeneratedContent] = useState({});
  const [currentDocId, setCurrentDocId] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadType, setUploadType] = useState('pdf');
  const { checkUploadLimit, checkGenerationLimit, incrementUsage, incrementUploadCount } = useSubscription();

  const resetState = () => {
    setFile(null);
    setUrl('');
    setIsUploaded(false);
    setError('');
    setSuccessMessage('');
    setGeneratedContent({
      twitter: null,
      tiktok: null,
      youtube: null
    });
    setCurrentDocId(null);
  };

  const extractTextFromPDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      // Clean and truncate the text
      fullText = fullText.replace(/\s+/g, ' ').trim();
      return truncateContent(fullText);
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to read the PDF file. Please make sure it\'s a valid PDF document.');
    }
  };

  const truncateContent = (text, maxLength = 3000) => {
    // First, try to find a natural breakpoint (end of a sentence)
    const sentences = text.split(/[.!?]+/);
    let truncated = '';
    let charCount = 0;

    for (const sentence of sentences) {
      if ((charCount + sentence.length) > maxLength) {
        break;
      }
      truncated += sentence + '. ';
      charCount += sentence.length + 2; // +2 for the period and space
    }

    // If no natural breakpoint is found, just truncate at maxLength
    if (!truncated) {
      truncated = text.slice(0, maxLength);
    }

    return truncated.trim();
  };

  const handleFile = async (selectedFile) => {
    setError('');
    setIsUploaded(false);
    if (selectedFile?.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    if (selectedFile.size > 1000000) { // 1MB limit
      setError('File size must be less than 1MB');
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    try {
      setProcessing(true);
      setError(null);
      setSuccessMessage('');

      console.log('Current user:', auth.currentUser?.uid);

      // Debug: Check upload limits before proceeding
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      console.log('User document data:', userDoc.data());
      
      if (!userDoc.exists()) {
        console.log('Creating new user document with initial limits');
        await setDoc(userRef, {
          limits: {
            pdfUploads: { used: 0, limit: 2 },
            websiteUploads: { used: 0, limit: 1 }
          },
          subscription: 'free'
        });
      }
      
      const userData = userDoc.data();
      console.log('Current PDF upload limits:', userData?.limits?.pdfUploads);

      const canUpload = await checkUploadLimit('pdf');
      console.log('Can upload check result:', canUpload);
      if (!canUpload) {
        console.log('Upload limit reached according to check');
        setError('Daily PDF upload limit reached. Upgrade to Pro for more uploads!');
        return;
      }

      const text = await extractTextFromPDF(file);
      console.log('Extracted text:', text);

      // Save to Firestore
      if (!auth.currentUser) {
        throw new Error('You must be logged in to upload');
      }

      const docData = {
        userId: auth.currentUser.uid,
        fileName: file.name,
        content: text,
        uploadedAt: new Date(),
        processed: false,
        sourceType: 'pdf',
        generatedContent: {},
        status: 'uploaded'
      };
      
      console.log('Attempting to save document:', docData);

      const docRef = await addDoc(collection(db, 'pdf-contents'), docData);
      console.log('Saved to Firestore with ID:', docRef.id);

      // After successful upload, update limits
      const updatedDoc = await getDoc(userRef);
      const updatedData = updatedDoc.data();
      console.log('Current limits before update:', updatedData?.limits);
      
      // Safely get the current used count
      const currentUsed = Number(updatedData?.limits?.pdfUploads?.used) || 0;
      const newUsed = currentUsed + 1;
      console.log('New used count will be:', newUsed);

      await updateDoc(userRef, {
        'limits.pdfUploads.used': newUsed
      });
      console.log('Updated upload count in Firestore');

      setCurrentDocId(docRef.id);
      setProcessing(false);
      setSuccessMessage('PDF uploaded successfully!');
      setIsUploaded(true);

    } catch (error) {
      console.error('Error processing PDF:', error);
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async (type) => {
    try {
      setError(null);
      // Check generation limit for this document
      const canGenerate = await checkGenerationLimit(currentDocId, type);
      if (!canGenerate) {
        setError(`Generation limit reached for ${type}. Upgrade to Pro for more generations!`);
        return;
      }

      setGenerating(prev => ({ ...prev, [type]: true }));
      
      // Get the document content
      const docRef = doc(db, 'pdf-contents', currentDocId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const content = docSnap.data().content;
      if (!content) {
        throw new Error('No content available to process');
      }

      const result = await generateContent(content, type);
      
      // Update the document in Firestore with the generated content
      await updateDoc(docRef, {
        [`generatedContent.${type}`]: {
          content: result.content,
          generatedAt: new Date()
        }
      });
      console.log(`Updated Firestore with ${type} content:`, result);
      
      // Increment generation usage
      await incrementUsage(currentDocId, type);
      
      setGeneratedContent(prev => ({
        ...prev,
        [type]: result
      }));
      setSuccessMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} content generated successfully!`);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to generate content. Please try again.');
    } finally {
      setGenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  const removeFile = () => {
    setFile(null);
    setIsUploaded(false);
    setError('');
  };

  const formatContent = (content, type) => {
    console.log('Formatting content:', content, type);
    if (!content) return [];
    
    const contentText = content.content || '';
    console.log('Content text:', contentText);
    
    let sections;
    if (type === 'twitter') {
      sections = contentText.split(/\[POST\s*\d+\]/i)
        .filter(section => section.trim());
    } else if (type === 'tiktok') {
      sections = contentText.split(/\[CONCEPT\s*\d+\]/i)
        .filter(section => section.trim());
    } else if (type === 'youtube') {
      sections = contentText.split(/\[VIDEO\s*\d+\]/i)
        .filter(section => section.trim())
        .filter(section => {
          // Skip the introduction text and empty sections
          const cleaned = section.toLowerCase().trim();
          return !cleaned.includes('here are') && 
                 !cleaned.includes('youtube video ideas') && 
                 section.includes('Title:');
        });
    }
    
    console.log('Sections:', sections);
    return sections.map(section => {
      const lines = section.trim().split('\n');
      if (type === 'twitter') {
        return { content: lines.join('\n').trim() };
      }
      
      const item = {};
      lines.forEach(line => {
        const [key, ...value] = line.split(':');
        if (key && value.length) {
          item[key.trim().toLowerCase()] = value.join(':').trim();
        }
      });
      return item;
    });
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleUrlUpload = async (url) => {
    try {
      setProcessing(true);
      setError(null);
      setSuccessMessage('');

      const canUpload = await checkUploadLimit('website');
      if (!canUpload) {
        setError('Daily website link limit reached. Upgrade to Pro for more uploads!');
        return;
      }

      // Validate URL
      if (!url.trim() || !url.match(/^https?:\/\/.+/)) {
        throw new Error('Please enter a valid URL');
      }

      // Save to Firestore
      if (!auth.currentUser) {
        throw new Error('You must be logged in to upload');
      }

      const docRef = await addDoc(collection(db, 'pdf-contents'), {
        userId: auth.currentUser.uid,
        fileName: url,
        content: url,
        uploadedAt: new Date(),
        processed: false,
        sourceType: 'url',
        generatedContent: {},
        status: 'uploaded'
      });

      // Increment website upload counter
      await incrementUploadCount('website');

      setCurrentDocId(docRef.id);
      setSuccessMessage('URL uploaded successfully!');
      setIsUploaded(true);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Helper function to check if any generation is in progress
  const isAnyGenerating = () => {
    return Object.values(generating).some(status => status);
  };

  return (
    <UploadContainer>
      <UploadTypeSwitch>
        <SwitchButton 
          $active={uploadType === 'pdf'} 
          onClick={() => {
            setUploadType('pdf');
            resetState();
          }}
        >
          PDF Upload
        </SwitchButton>
        <SwitchButton 
          $active={uploadType === 'url'} 
          onClick={() => {
            setUploadType('url');
            resetState();
          }}
        >
          Website URL
        </SwitchButton>
      </UploadTypeSwitch>

      {successMessage && (
        <SuccessMessage>{successMessage}</SuccessMessage>
      )}

      {uploadType === 'pdf' ? (
        <DropZone
          $isDragging={isDragging}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileInput
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          {!file ? (
            <p>Drag & drop a PDF file here, or click to select</p>
          ) : (
            <FileInfo>
              <FileName>{file.name}</FileName>
              <RemoveButton onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}>
                ✕
              </RemoveButton>
            </FileInfo>
          )}
        </DropZone>
      ) : (
        <div>
          <URLInput
            type="url"
            placeholder="Enter website URL (e.g., https://example.com/article)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {((uploadType === 'pdf' && file && !isUploaded) || 
        (uploadType === 'url' && url && !isUploaded)) && (
        <UploadButton 
          onClick={uploadType === 'pdf' ? handleUpload : () => handleUrlUpload(url)}
          disabled={processing || (uploadType === 'url' && !url.trim())}
        >
          {processing ? (
            <>
              <LoadingSpinner /> Processing...
            </>
          ) : (
            'Upload'
          )}
        </UploadButton>
      )}

      {isUploaded && (
        <>
          <ButtonGroup>
            <ActionButton
              onClick={() => handleGenerate('twitter')}
              disabled={generating.twitter || isAnyGenerating()}
            >
              {generating.twitter ? (
                <>
                  <LoadingSpinner /> Generating Twitter Posts...
                </>
              ) : (
                'Generate Twitter Posts'
              )}
            </ActionButton>

            <ActionButton
              onClick={() => handleGenerate('tiktok')}
              disabled={generating.tiktok || isAnyGenerating()}
            >
              {generating.tiktok ? (
                <>
                  <LoadingSpinner /> Generating TikTok Ideas...
                </>
              ) : (
                'Generate TikTok Ideas'
              )}
            </ActionButton>

            <ActionButton
              onClick={() => handleGenerate('youtube')}
              disabled={generating.youtube || isAnyGenerating()}
            >
              {generating.youtube ? (
                <>
                  <LoadingSpinner /> Generating YouTube Ideas...
                </>
              ) : (
                'Generate YouTube Ideas'
              )}
            </ActionButton>
          </ButtonGroup>

          {console.log('Current generatedContent:', generatedContent)}

          {Object.entries(generatedContent).map(([type, content]) => {
            console.log('Rendering content for type:', type, content);
            return content && (
              <ContentCard key={type}>
                <CardTitle>
                  {type === 'twitter' ? 'Twitter/X Posts' : 
                   type === 'tiktok' ? 'TikTok Ideas' : 
                   'YouTube Ideas'}
                </CardTitle>
                <ContentGrid>
                  {formatContent(content, type).map((item, index) => (
                    <ContentItemCard key={index} $type={type}>
                      <CopyButton onClick={() => handleCopy(
                        type === 'twitter' ? item.content : 
                        Object.entries(item)
                          .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
                          .join('\n')
                      )}>
                        📋
                      </CopyButton>
                      {type === 'twitter' ? (
                        <ContentText style={{ whiteSpace: 'pre-wrap' }}>{item.content}</ContentText>
                      ) : (
                        <ContentText>
                          {Object.entries(item).map(([key, value]) => (
                            <div key={key} style={{ marginBottom: '0.5rem' }}>
                              <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{' '}
                              <span style={{ whiteSpace: 'pre-wrap' }}>{value}</span>
                            </div>
                          ))}
                        </ContentText>
                      )}
                    </ContentItemCard>
                  ))}
                </ContentGrid>
              </ContentCard>
            );
          })}
        </>
      )}
    </UploadContainer>
  );
};

export default PDFUpload; 