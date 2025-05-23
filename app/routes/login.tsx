// login.tsx
import { Form, useActionData, redirect } from "react-router-dom";
import { createDirectus, authentication, rest } from "@directus/sdk";
import type { ActionFunctionArgs } from "react-router-dom";

// Directus client setup
const client = createDirectus("http://128.140.75.83:2221")
  .with(authentication("json"))
  .with(rest());

// Action function with cookie-based auth
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  try {
    const result = await client.login(email!, password!);
    const token = result.access_token;

    // Redirect with Set-Cookie header
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/dashboard",
        "Set-Cookie": `directus_token=${token}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Login failed. Check your credentials." }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export default function Login() {
  const actionData = useActionData() as
    | { success: false; message: string }
    | undefined;

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Login</h2>
      <Form method="post">
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />
        <button type="submit" style={{ padding: 10, width: "100%" }}>
          Login
        </button>
      </Form>

      {actionData && (
        <p style={{ color: "red", marginTop: 10 }}>{actionData.message}</p>
      )}
    </div>
  );
}
