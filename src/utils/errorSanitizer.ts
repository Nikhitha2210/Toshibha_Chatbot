export const sanitizeError = (error: any): string => {
  if (!error) return 'An error occurred';
  
  let errorMessage = '';
  
  // Extract message from error object
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error.detail) {
    errorMessage = error.detail;
  } else {
    errorMessage = String(error);
  }
  
  const isHtmlError = errorMessage.includes('<!DOCTYPE html>') || 
                     errorMessage.includes('<html>') ||
                     errorMessage.includes('<head>') ||
                     errorMessage.includes('<body>') ||
                     errorMessage.includes('<style>') ||
                     errorMessage.includes('<script>') ||
                     errorMessage.length > 1000; // Very long errors are usually HTML dumps
  
  if (isHtmlError) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  if (errorMessage.includes('Network request failed')) {
    return 'Cannot connect to server. Please check your internet connection.';
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('TimeoutError')) {
    return 'Request timed out. Please try again.';
  }
  
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
    return 'Authentication failed. Please log in again.';
  }
  
  if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
    return 'Server error. Please try again later.';
  }
  
  if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
    return 'Cannot reach server. Please check your internet connection.';
  }
  
  if (errorMessage.length > 200) {
    return 'An error occurred. Please try again.';
  }
  
  return errorMessage;
};

// Helper function to check if response contains HTML
export const isHtmlResponse = (text: string): boolean => {
  return text.includes('<!DOCTYPE html>') || 
         text.includes('<html>') || 
         text.includes('<head>') ||
         text.includes('<body>');
};

// Helper function to create user-friendly alert
export const showCleanError = (error: any, title: string = 'Error') => {
  const cleanMessage = sanitizeError(error);
  

  return {
    title,
    message: cleanMessage
  };
};