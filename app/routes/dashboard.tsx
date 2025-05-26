import {useLoaderData,Form,redirect, type LoaderFunctionArgs,type ActionFunctionArgs,} from "react-router-dom";
import axios from "axios";
import { Container, Paper, TextInput, Title, Text, Button, Stack, Group, Divider } from "@mantine/core";
import { client } from '../utils/directus';  //directus client import
import { auth } from "@directus/sdk";
import { readMe } from "@directus/sdk";


interface Feedback {
  id: number;
  title: string;
  description: string;
  category: string;
}

function getToken(cookie: string | null): string | null {
  if (!cookie) return null;
  const match = cookie.match(/directus_token=([^;]+)/);
  return match ? match[1] : null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const token = getToken(request.headers.get("Cookie"));
  if (!token) return redirect("/login");

  try {
    client.setToken(token); // Authenticate the SDK client

    const user=await client.request(readMe()); // Get current user
    const userId = user.id;

    const feedbacks = await client.items('feedbacks').readByQuery({
      filter: {
        user_created: {
          _eq: userId
        }
      }
    });

    return Response.json({ feedbacks: feedbacks.data });
  } catch {
    return redirect("/login");
  }
}


export async function action({ request }: ActionFunctionArgs) {
  const token = getToken(request.headers.get("Cookie"));
  if (!token) return redirect("/login");

  const form = await request.formData();
  const title = form.get("title")?.toString();
  const description = form.get("description")?.toString();
  const category = form.get("category")?.toString();

  if (!title || !description || !category)
    return Response.json({ error: "All fields are required" }, { status: 400 });

  try {
    // await axios.post(
    //   `${API_URL}/items/feedbacks`,
    //   { title, description, category },
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );
    // return redirect("/dashboard");
    const user = await client.users.me.read(); // Get current user
    const userId = user.id;
    await client.items('feedbacks').createOne({ title, description, category, user_created: userId });
    return redirect("/dashboard");
  } catch {
    return Response.json({ error: "Failed to add feedback" }, { status: 500 });
  }
}

export default function Dashboard() {
  const { feedbacks } = useLoaderData() as { feedbacks: Feedback[] };

  return (
    <Container size="sm" py="xl">
      <Title order={1} ta="center" mb="xl" c='teal'>
        Dashboard
      </Title>

      <Paper shadow="md" radius="md" p="lg" withBorder mb="xl">
        <Title order={2} mb="md">
          Add Feedback
        </Title>
        <Form method="post">
          <Stack>
            <TextInput name="title" placeholder="Title" required />
            <TextInput name="description" placeholder="Description" required />
            <TextInput name="category" placeholder="Category" required />
            <Button type="submit" fullWidth mt="md">
              Submit
            </Button>
          </Stack>
        </Form>
      </Paper>

      <Title order={2} mb="md">
        Your Feedbacks
      </Title>

      {feedbacks.length ? (
        <Stack>
          {feedbacks.map(({ id, title, description, category }) => (
            <Paper key={id} shadow="xs" radius="md" p="md" withBorder>
              <Group justify="space-between">
                <Text fw={600} size="lg">
                  {title}
                </Text>
                <Text c="dimmed" size="sm">
                  {category}
                </Text>
              </Group>
              <Divider my="sm" />
              <Text>{description}</Text>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Text>No feedbacks yet.</Text>
      )}
    </Container>
  );
}
