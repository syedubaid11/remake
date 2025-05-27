import {Container,Paper,TextInput,PasswordInput,Title, Button,Stack,Alert,} from "@mantine/core";
import { Form, useActionData, useNavigation } from "react-router-dom";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";
import { client } from "../utils/directus";
import { readMe, readRole } from "@directus/sdk";
import { useForm } from "@rvf/react";
import { withYup } from "@rvf/yup";
import * as yup from "yup";


const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password too short").required("Password is required"),
});

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
    return {
      success: false,
      message: "Email or password missing.",
    };
  }

  try {
    const result = await client.login(email, password);
    const token = result.access_token;
    client.setToken(token);

    const user = await client.request(readMe());
    const roleId = user.role;

    if (!roleId) {
      return {
        success: false,
        message: "User role not found.",
      };
    }

    const roleInfo = await client.request(readRole(roleId));
    const roleName = roleInfo.name;

    if (roleName !== "Administrator") {
      return {
        success: false,
        message: "You do not have permission to access this page.",
      };
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/admin",
        "Set-Cookie": `directus_token=${token}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Login failed. Check your credentials.",
    };
  }
}

export default function AdminLogin() {
  const actionData = useActionData() as { success: false; message: string } | undefined;
  const navigation = useNavigation();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validator: withYup(schema),
  });

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
        <Form method="post" {...form.getFormProps()}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="you@example.com"
              {...form.getInputProps("email")}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              {...form.getInputProps("password")}
              required
            />
            <Button type="submit" fullWidth loading={navigation.state === "submitting"}>
              Login
            </Button>
          </Stack>
        </Form>
      </Paper>
    </Container>
  );
}
