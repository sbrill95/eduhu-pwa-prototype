import React from 'react';
import { IonSpinner, IonText } from '@ionic/react';

interface LoadingSpinnerProps {
  message?: string;
  showLogo?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Lädt...',
  showLogo = true,
  size = 'medium',
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'space-y-2',
          logo: 'h-6 w-6',
          spinner: 1.0,
          text: 'text-xs'
        };
      case 'large':
        return {
          container: 'space-y-4',
          logo: 'h-10 w-10',
          spinner: 1.5,
          text: 'text-base'
        };
      default: // medium
        return {
          container: 'space-y-3',
          logo: 'h-8 w-8',
          spinner: 1.2,
          text: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex flex-col items-center ${sizeClasses.container} ${className}`}>
      {showLogo && (
        <img
          src="/eduhu-logo.svg"
          alt="eduhu.app"
          className={`mx-auto mb-2 object-contain ${sizeClasses.logo}`}
        />
      )}
      <div className="flex flex-col items-center space-y-2">
        <IonSpinner
          name="crescent"
          className="text-blue-600"
          style={{ transform: `scale(${sizeClasses.spinner})` }}
        />
        <IonText className={`text-gray-600 font-medium ${sizeClasses.text}`}>
          {message}
        </IonText>
      </div>
    </div>
  );
};

export default LoadingSpinner;