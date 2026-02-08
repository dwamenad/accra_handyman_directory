export default function CustomerSignupPage() {
  return (
    <div style={{ padding: "18px 0" }}>
      <h1>Customer Signup</h1>
      <form action="/api/auth/signup" method="post" className="card grid" style={{ maxWidth: 480 }}>
        <input type="hidden" name="role" value="CUSTOMER" />
        <input name="name" placeholder="Full name" required />
        <input name="phone" placeholder="Phone (+233...)" required />
        <input name="email" placeholder="Email (optional)" type="email" />
        <input name="password" type="password" minLength={6} placeholder="Password" required />
        <button type="submit">Create account</button>
      </form>
    </div>
  );
}
