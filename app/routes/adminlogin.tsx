import { Form, useActionData } from "react-router-dom";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";
import { Container, Paper,TextInput,PasswordInput,Title,Button,Text,Stack,Alert,} from "@mantine/core";
import { client } from "../utils/directus";
import { readMe,readRole } from "@directus/sdk";
import {withYup} from "@rvf/yup";
import {useForm} from "@rvf/react";
import * as yup from 'yup';

const schema=yup.object({
  email:yup.string().email("Invalid Email").required("Email is required!!!"),
  password:yup.string().min(4,"Password must be greater than 4 characters").required("Password is required!!"),
})

export async function loader({ request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("cookie");
  const token = cookie?.match(/directus_token=([^;]+)/)?.[1];

  if (token) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/admin",
      },
    });
  }

  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return new Response(
      JSON.stringify({ success: false, message: "Email or password missing." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Login and set token
    const result = await client.login(email, password);
    const token = result.access_token;
    client.setToken(token);

    // Get current user info
    const user=await client.request(readMe());
    const roleId=user.role;


    if (!roleId) {
      return new Response(
        JSON.stringify({ success: false, message: "User role not found." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    //get the role details
    const roleInfo = await client.request(readRole(roleId));
    const roleName = roleInfo.name;

    if (roleName !== "Administrator") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "You do not have permission to access this page.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Redirect and set cookie
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/admin",
        "Set-Cookie": `directus_token=${token}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Login failed. Check your credentials.",
      }),
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
    <Container size={420} my={60}>
      <Title ta="center" mb="md" c="teal">
        Admin Login
      </Title>

      <Paper withBorder shadow="md" p={30} radius="md">
        {actionData && (
          <Alert color="red" mb="md">
            {actionData.message}
          </Alert>
        )}
        <form method="post">
          <Stack>
            <TextInput
              name="email"
              label="Email"
              placeholder="you@example.com"
              required
            />
            <PasswordInput
              name="password"
              label="Password"
              placeholder="Your password"
              required
            />
            <Button type="submit" fullWidth>
              Login
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
