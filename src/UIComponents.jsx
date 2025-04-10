"use client"

export const LoadingSkeleton = () => {
  return (
    <div
      className="loading-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="loading-spinner"
        style={{
          width: "50px",
          height: "50px",
          border: "5px solid #f3f3f3",
          borderTop: "5px solid #3498db",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      ></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export const ErrorMessage = ({ message, onDismiss }) => {
  return (
    <div
      className="error-container"
      style={{
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#f8d7da",
        color: "#721c24",
        padding: "15px 20px",
        borderRadius: "4px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 1001,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        maxWidth: "80%",
      }}
    >
      <div className="error-icon">⚠️</div>
      <div className="error-text">{message}</div>
      <button
        onClick={onDismiss}
        style={{
          backgroundColor: "transparent",
          border: "none",
          fontSize: "16px",
          cursor: "pointer",
          marginLeft: "auto",
        }}
      >
        ✕
      </button>
    </div>
  )
}

export const TabPanel = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{
        display: value === index ? "block" : "none",
        height: "100%",
        overflow: "auto",
      }}
    >
      {value === index && children}
    </div>
  )
}

export const Tabs = ({ value, onChange, tabs }) => {
  return (
    <div
      className="tabs-container"
      style={{
        display: "flex",
        borderBottom: "1px solid #ddd",
      }}
    >
      {tabs.map((tab, index) => (
        <button
          key={index}
          onClick={() => onChange(index)}
          style={{
            padding: "10px 15px",
            backgroundColor: value === index ? "#fff" : "#f8f9fa",
            border: "none",
            borderBottom: value === index ? "2px solid #4361ee" : "2px solid transparent",
            cursor: "pointer",
            fontWeight: value === index ? "bold" : "normal",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
