const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const canUpload = await checkUploadLimit('website');
    if (!canUpload) {
      setError('Daily website link limit reached. Upgrade to Pro for more uploads!');
      return;
    }

    // Rest of submit code...
  } catch (error) {
    console.error('Error:', error);
    setError(error.message);
  }
}; 