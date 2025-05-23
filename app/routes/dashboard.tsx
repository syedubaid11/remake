import {
  useLoaderData,
  Form,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router-dom";
import axios from "axios";

interface Feedback {
  id: number;
  title: string;
  description: string;
  category: string;
}

const API_URL = "http://128.140.75.83:2221";

function getToken(cookie: string | null): string | null {
  if (!cookie) return null;
  const match = cookie.match(/directus_token=([^;]+)/);
  return match ? match[1] : null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const token = getToken(request.headers.get("Cookie"));
  if (!token) return redirect("/login");

  try {
    const userRes = await axios.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userId = userRes.data.data.id;

    const feedbackRes = await axios.get(
      `${API_URL}/items/feedbacks?filter[user_created][_eq]=${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return Response.json({ feedbacks: feedbackRes.data.data });
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
    await axios.post(
      `${API_URL}/items/feedbacks`,
      { title, description, category },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return redirect("/dashboard");
  } catch {
    return Response.json({ error: "Failed to add feedback" }, { status: 500 });
  }
}

export default function Dashboard() {
  const { feedbacks } = useLoaderData() as { feedbacks: Feedback[] };

  return (
    <div className="min-h-screen p-8 bg-slate-900 text-white flex flex-col items-center gap-8">
      <h1 className="text-5xl font-bold">Dashboard</h1>

      <Form method="post" className="bg-white text-black p-6 rounded w-full max-w-md">
        <h2 className="text-xl mb-4 font-semibold">Add Feedback</h2>
        <input name="title" placeholder="Title" className="input" required />
        <input name="description" placeholder="Description" className="input" required />
        <input name="category" placeholder="Category" className="input" required />
        <button type="submit" className="btn mt-4 w-full">Submit</button>
      </Form>

      <div className="max-w-xl w-full">
        <h2 className="text-xl mb-4 font-semibold">Your Feedbacks</h2>
        {feedbacks.length ? (
          feedbacks.map(({ id, title, description, category }) => (
            <div key={id} className="bg-white text-black rounded p-4 mb-4 shadow">
              <h3 className="font-bold text-lg">{title}</h3>
              <p>{description}</p>
              <small className="text-gray-700">Category: {category}</small>
            </div>
          ))
        ) : (
          <p>No feedbacks yet.</p>
        )}
      </div>
    </div>
  );
}