export default function LoginPage() {
  return (
    <div style={{ padding: "18px 0" }}>
      <h1>Login</h1>
      <form action="/api/auth/login" method="post" className="card grid" style={{ maxWidth: 440 }}>
        <input name="phone" placeholder="Phone (+233...)" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
