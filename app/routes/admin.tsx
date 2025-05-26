import { redirect, useLoaderData, useNavigate } from "react-router-dom";
import type { LoaderFunctionArgs } from "react-router";
import { useState } from "react";
import {Button,Container, Group, Select, Stack, TextInput, Textarea,Title, Paper, Text,Flex, Alert} from "@mantine/core";
import { Form } from "react-router";
import { client } from "../utils/directus";
import { deleteItem, readItems, updateItem, createItem } from "@directus/sdk";

export interface Feedback {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
}

interface LoaderData {
  token: string;
  feedbacks: Feedback[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const cookie = request.headers.get("cookie");
    const token = cookie?.match(/directus_token=([^;]+)/)?.[1];

    if (!token) {
      return redirect("/login");
    }

    client.setToken(token); // Ensure token is set

    const feedbacks = await client.request(readItems("feedbacks"));

    if (!feedbacks || !Array.isArray(feedbacks)) {
      throw new Error("Failed to fetch feedbacks.");
    }

    return { token, feedbacks };
  } catch (error) {
    console.error("Failed to fetch feedbacks:", error);
    return redirect("/login"); // Or show a proper error page
  }
}

export default function Admin() {
  const { token, feedbacks: initialFeedbacks } = useLoaderData() as LoaderData;
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [newFeedback, setNewFeedback] = useState({
    title: "",
    description: "",
    category: "",
  });
  const navigate = useNavigate();

  // Set token for all requests
  if (token) {
    client.setToken(token);
  }

  const fetchFeedbacks = async () => {
    try {
      setError("");
      const feedbacks = await client.request(readItems("feedbacks"));
      //@ts-ignore
      setFeedbacks(feedbacks || []);
    } catch (error: any) {
      console.error("Failed to fetch feedbacks:", error);
      setError("Failed to fetch feedbacks. Please try again.");
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      setError("");
      setLoading(true);
      
      await client.request(updateItem("feedbacks", id, { status }));
      
      // Update local state instead of refetching
      setFeedbacks(prev => prev.map(fb => 
        fb.id === id ? { ...fb, status } : fb
      ));
    } catch (error: any) {
      console.error("Failed to update status:", error);
      setError("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setError("");
      setLoading(true);
      
      await client.request(deleteItem("feedbacks", id));
      
      // Update local state
      setFeedbacks(feedbacks.filter((fb) => fb.id !== id));
    } catch (error: any) {
      console.error("Failed to delete feedback:", error);
      setError("Failed to delete feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError("");
      setLoading(true);
      
      const newItem = await client.request(createItem("feedbacks", {
        ...newFeedback,
        status: "pending" // Set default status
      }));
      
      // Update local state
      setFeedbacks([...feedbacks, newItem as Feedback]);
      setNewFeedback({ title: "", description: "", category: "" });
      setShowAddForm(false);
    } catch (error: any) {
      console.error("Failed to add feedback:", error);
      setError("Failed to add feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear all cookies
    document.cookie = `admin_token=; path=/; Max-Age=0`;
    document.cookie = `directus_token=; path=/; Max-Age=0`;
    navigate("/adminlogin");
  };

  return (
    <Container size="lg" p="md">
      <Group position="apart" mb="lg">
        <Title order={2}>Admin Dashboard</Title>
        <Group>
          <Button 
            color="blue" 
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={loading}
          >
            {showAddForm ? "Cancel" : "Add Feedback"}
          </Button>
          <Button color="red" variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert color="red" mb="md" onClose={() => setError("")} withCloseButton>
          {error}
        </Alert>
      )}

      {showAddForm && (
        <Paper withBorder p="md" mb="md" radius="md" shadow="sm">
          <form onSubmit={handleAdd}>
            <Stack>
              <TextInput
                label="Title"
                placeholder="Enter feedback title"
                value={newFeedback.title}
                onChange={(e) =>
                  setNewFeedback({ ...newFeedback, title: e.target.value })
                }
                required
                disabled={loading}
              />
              <Textarea
                label="Description"
                placeholder="Enter feedback description"
                value={newFeedback.description}
                onChange={(e) =>
                  setNewFeedback({ ...newFeedback, description: e.target.value })
                }
                required
                minRows={3}
                disabled={loading}
              />
              <Select
                label="Category"
                data={[
                  { value: "bug", label: "Bug" },
                  { value: "feature", label: "Feature Request" },
                  { value: "improvement", label: "Improvement" },
                  { value: "other", label: "Other" },
                ]}
                placeholder="Select category"
                value={newFeedback.category}
                onChange={(value) =>
                  setNewFeedback({ ...newFeedback, category: value || "" })
                }
                required
                disabled={loading}
              />
              <Group>
                <Button 
                  type="submit" 
                  color="green" 
                  loading={loading}
                  disabled={loading}
                >
                  Add Feedback
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      )}

      <Stack>
        {feedbacks.length === 0 ? (
          <Paper withBorder p="md" radius="md">
            <Text ta="center" c="dimmed">
              No feedback found. Add some feedback to get started!
            </Text>
          </Paper>
        ) : (
          feedbacks.map((fb) => (
            <Paper key={fb.id} withBorder p="md" radius="md" shadow="xs">
              <Group position="apart" mb="xs">
                <Text fw={500} size="lg">
                  {fb.title}
                </Text>
                <Select
                  data={[
                    { value: "pending", label: "Pending" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "resolved", label: "Resolved" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                  value={fb.status || "pending"}
                  onChange={(value) => value && handleStatusUpdate(fb.id, value)}
                  size="sm"
                  w={150}
                  disabled={loading}
                />
              </Group>
              
              <Text mb="sm" lineClamp={3}>
                {fb.description}
              </Text>
              
              <Flex justify="space-between" align="center">
                <Text size="sm" c="dimmed" tt="capitalize">
                  Category: {fb.category}
                </Text>
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  onClick={() => handleDelete(fb.id)}
                  loading={loading}
                  disabled={loading}
                >
                  Delete
                </Button>
              </Flex>
            </Paper>
          ))
        )}
      </Stack>
    </Container>
  );
}