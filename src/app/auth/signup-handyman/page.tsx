export default function HandymanSignupPage() {
  return (
    <div style={{ padding: "18px 0" }}>
      <h1>Join as Handyman</h1>
      <form action="/api/auth/signup" method="post" className="card grid" style={{ maxWidth: 520 }}>
        <input type="hidden" name="role" value="HANDYMAN" />
        <input name="name" placeholder="Your name" required />
        <input name="businessName" placeholder="Business name" required />
        <input name="phone" placeholder="Public phone (+233...)" required />
        <input name="password" type="password" minLength={6} placeholder="Password" required />
        <label className="row">
          <input name="showPhonePublicly" type="checkbox" value="true" defaultChecked style={{ width: 14 }} />
          I consent to showing my phone publicly
        </label>
        <button type="submit">Create handyman account</button>
      </form>
    </div>
  );
}
