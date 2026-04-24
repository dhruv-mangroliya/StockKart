export default function Login() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");

  return (
    <div className="login-page">
      <div className="bg-shapes">
        {[...Array(12)].map((_, i) => <div key={i} className={`shape shape-${i + 1}`} />)}
      </div>
      <div className="login-card">
        <div className="login-logo">📦</div>
        <h1>Inventory Manager</h1>
        <p>Sign in to manage your inventory, production and stores.</p>
        {error && <p className="error">Authentication failed. Please try again.</p>}
        <a href="http://localhost:3001/auth/google" className="google-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} />
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
