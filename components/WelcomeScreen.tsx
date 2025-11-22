import React, { useState } from 'react';
import { Shield, Layout, Loader2 } from 'lucide-react';

// TODO: PASTE YOUR GOOGLE CLIENT ID HERE
// Go to Google Cloud Console -> Credentials -> Create Credentials -> OAuth Client ID
// Application Type: Web Application
// Authorized JavaScript origins: http://localhost:3000 (or your github pages URL)
const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com";

declare global {
  interface Window {
    google: any;
  }
}

interface WelcomeScreenProps {
  onLoginSuccess: (token: string) => void;
  onDemoMode: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLoginSuccess, onDemoMode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    setError('');
    setIsLoading(true);

    if (!window.google || !window.google.accounts) {
      setError("Google Sign-In script not loaded. Please check your internet connection.");
      setIsLoading(false);
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.access_token) {
            onLoginSuccess(response.access_token);
          } else {
            setIsLoading(false);
            if (response.error) {
               setError(`Login error: ${response.error}`);
            }
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setError('Configuration Error: Please ensure GOOGLE_CLIENT_ID is set in the code.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-8 py-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-full shadow-lg bg-opacity-20 backdrop-blur-md">
               <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CleanSwift</h1>
          <p className="text-primary-100 font-medium">Professional Management Suite</p>
        </div>

        {/* Login Section */}
        <div className="p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">Welcome Back</h2>
              <p className="text-sm text-gray-500">Sign in to access your dashboard and sync your data.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full group relative flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-sm hover:shadow-md"
            >
               {isLoading ? (
                 <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
               ) : (
                 <>
                   <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
                   <span>Sign in with Google</span>
                 </>
               )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={onDemoMode}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
               <Layout size={16} />
               Continue in Demo Mode
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
           <p className="text-xs text-gray-400">
             Securely connected to your Google Sheets.
           </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;