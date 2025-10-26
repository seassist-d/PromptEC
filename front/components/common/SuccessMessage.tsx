'use client';

interface SuccessMessageProps {
  message: string;
  onClose?: () => void;
  showIcon?: boolean;
}

export default function SuccessMessage({ 
  message, 
  onClose, 
  showIcon = true 
}: SuccessMessageProps) {
  return (
    <div 
      className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-sm"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <svg 
              className="h-5 w-5 text-green-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
        <div className={showIcon ? 'ml-3 flex-1' : 'flex-1'}>
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 inline-flex text-green-400 hover:text-green-500"
            aria-label="閉じる"
          >
            <svg 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

