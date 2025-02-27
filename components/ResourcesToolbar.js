"use client"

const ResourcesToolbar = () => {
  return (
    <div style={styles.toolbar}>
      <div style={styles.toolbarContent}>
        <div style={styles.resourceLinks}>
          <a href="https://xfoundry.org" target="_blank" rel="noopener noreferrer" style={styles.link}>
            xFoundry
          </a>
          <div style={styles.divider}></div>
          <a href="https://connexion.xfoundry.org" target="_blank" rel="noopener noreferrer" style={styles.link}>
            ConneXions Community
          </a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  toolbar: {
    backgroundColor: "#f0f0f0",
    borderBottom: "1px solid #ddd",
    height: "30px",
    width: "100%",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 1000,
  },
  toolbarContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },
  resourceLinks: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "12px",
  },
  link: {
    color: "var(--color-secondary)",
    textDecoration: "none",
    padding: "0 8px",
    transition: "color 0.2s ease",
  },
  link:hover: {
    color: "var(--color-primary)",
  },
  divider: {
    height: "12px",
    width: "1px",
    backgroundColor: "#ccc",
  },
};

export default ResourcesToolbar;