// admin-login.tsx
import { Form, useActionData } from "react-router-dom";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";
import { createDirectus, authentication, rest } from "@directus/sdk";
import axios from 'axios';

// Directus client setup
const client = createDirectus("http://128.140.75.83:2221")
  .with(authentication("json"))
  .with(rest());
const directus_url = "http://128.140.75.83:2221";

export async function loader({ request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("cookie");
  const token = cookie?.match(/directus_token=([^;]+)/)?.[1];

  if (token) {
    // Optionally, validate the token (e.g., client.getMe())
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/admin",
      },
    });
  }

  return null; // Proceed to login page
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  try {
    const result = await client.login(email!, password!);
    const token = result.access_token;


    const userInfo=await axios.get(`${directus_url}/users/me`,{
        headers:{
            Authorization: `Bearer ${token}`,
        }
    })

    const roleId=userInfo.data.data.role;

    if(!roleId){
        return new Response(JSON.stringify({ success: false, message: "User role not found." }), )
    }
    const roleInfo=await axios.get(`${directus_url}/roles/${roleId}`,{
        headers:{
            Authorization: `Bearer ${token}`,
        }
    })

    const roleName= roleInfo.data.data.name;

    if(roleName!=="Administrator"){
        return new Response(JSON.stringify({ success: false, message: "You do not have permission to access this page." }), )
    }
    return new Response(null,{
        status:302,
        headers:{
            Location:'/admin',
            "Set-Cookie": `directus_token=${token}; Path=/; HttpOnly; SameSite=Lax`,
        }
    })


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

export default function AdminLogin() {
  const actionData = useActionData() as | { success: false; message: string } | undefined;

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Admin Login</h2>
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
