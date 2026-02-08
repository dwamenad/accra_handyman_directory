export default function VerifyPhonePage() {
  return (
    <div style={{ padding: "18px 0" }}>
      <h1>Verify Phone</h1>
      <p className="small">Demo OTP is 123456. Replace with SMS provider integration in production.</p>
      <form action="/api/auth/verify-phone" method="post" className="card grid" style={{ maxWidth: 420 }}>
        <input name="code" placeholder="Enter OTP" required />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
}
