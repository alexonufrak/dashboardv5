const LoadingScreen = ({ message = "Loading dashboard..." }) => {
  return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p className="message">{message}</p>

      <style jsx>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.97);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease-in-out;
          backdrop-filter: blur(2px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(0, 86, 179, 0.1);
          border-left-color: #0056b3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .message {
          margin-top: 16px;
          font-size: 16px;
          color: #343a40;
          font-weight: 500;
          font-family: var(--font-sans);
        }
      `}</style>
    </div>
  )
}

export default LoadingScreen

