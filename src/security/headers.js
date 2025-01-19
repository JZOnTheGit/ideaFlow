// Add security headers
export const securityHeaders = {
  'Strict-Transport-Security': process.env.REACT_APP_STRICT_TRANSPORT_SECURITY,
  'Content-Security-Policy': process.env.REACT_APP_CONTENT_SECURITY_POLICY,
  'X-Frame-Options': process.env.REACT_APP_X_FRAME_OPTIONS,
  'X-Content-Type-Options': process.env.REACT_APP_X_CONTENT_TYPE_OPTIONS,
  'Referrer-Policy': process.env.REACT_APP_REFERRER_POLICY
}; 