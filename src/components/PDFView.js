import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
`;

const ContentCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    border: 2px solid rgba(196, 153, 82, 0.2);
    border-radius: 12px;
    z-index: -1;
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
  gap: 1.5rem;
  margin-top: 1.5rem;
  position: relative;
  padding: 1rem;
  max-width: 1400px;
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
    gap: 1.2rem;
    padding: 0.5rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    padding: 0;
  }
`;

const ContentItemCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.8rem 1.5rem 1.2rem 1.5rem;
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
  min-height: 200px;
  max-height: 280px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border-width: 2px;
  }

  @media (max-width: 768px) {
    min-height: 180px;
    max-height: 250px;
    padding: 1.5rem 1.2rem 1rem 1.2rem;
  }
`;

const ContentText = styled.div`
  margin-top: 2rem;
  flex: 1;
  overflow-y: auto;
  padding-right: 0.8rem;
  font-size: 0.9rem;
  line-height: 1.5;
  
  &::-webkit-scrollbar {
    width: 8px;
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
    padding-right: 0.5rem;
    margin-top: 1.8rem;
  }
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: #c49952;
  cursor: pointer;
  padding: 0.4rem;
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

const formatContent = (content, type) => {
  if (!content) return [];
  
  const contentText = content.content || '';
  
  const sections = contentText.split(/\[(POST|CONCEPT|VIDEO)\s*\d+\]/i)
    .filter(section => section.trim() && !section.match(/^(POST|CONCEPT|VIDEO)$/i));
  
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

const PDFView = ({ pdfData }) => {
  if (!pdfData) return null;

  const generatedContent = pdfData.generatedContent || {};

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Container>
      {Object.entries(generatedContent).map(([type, content]) => (
        content && content.content && (
          <ContentCard key={type}>
            <CardTitle>
              {type === 'twitter' ? 'Twitter/X Posts' : 
               type === 'tiktok' ? 'TikTok Ideas' : 
               'YouTube Ideas'}
            </CardTitle>
            {content.generatedAt && (
              <GeneratedDate>
                Generated on: {content.generatedAt.toDate().toLocaleDateString()} at {content.generatedAt.toDate().toLocaleTimeString()}
              </GeneratedDate>
            )}
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
        )
      ))}
    </Container>
  );
};

const GeneratedDate = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

export default PDFView; 