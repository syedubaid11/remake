// login.tsx
import {TextInput,PasswordInput,Button,  Paper,Title,Text,Stack,Container,} from "@mantine/core";
import { Form, useActionData } from "react-router-dom";
import { createDirectus, authentication, rest } from "@directus/sdk";
import type { ActionFunctionArgs } from "react-router-dom";
 
//directus initialised
const client = createDirectus("http://128.140.75.83:2221")
  .with(authentication("json"))
  .with(rest());

//action function
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  try {
    const result = await client.login(email!, password!);
    const token = result.access_token;
    //redirecting after setting cookies
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/dashboard",
        "Set-Cookie": `directus_token=${token}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  } catch (error) {
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

export default function Login() {
  const actionData = useActionData() as
    | { success: false; message: string }
    | undefined;

  return (
    <Container size={420} my={40}>
      <Title align="center" c='teal'>Login</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Enter your credentials to access the dashboard
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Form method="post">
          <Stack>
            <TextInput label="Email" name="email" placeholder="your@email.com" required />
            <PasswordInput label="Password" name="password" placeholder="Your password" required />
            <Button type="submit" fullWidth>
              Login
            </Button>
            {actionData && (
              <Text c="red" size="sm">
                {actionData.message}
              </Text>
            )}
          </Stack>
        </Form>
      </Paper>
    </Container>
  );
}
