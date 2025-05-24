import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";

const directus_url = "http://128.140.75.83:2221";

interface Feedback {
  id: number;
  title: string;
  description: string;
  category: string;
  status?: string;
}

interface LoaderData {
  token: string;
  feedbacks: Feedback[];
}

// 🔁 Loader
export async function loader({ request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("Cookie") || "";

  const tokenMatch = cookie.match(/directus_token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token) {
    return redirect("/adminlogin");
  }

  try {
    const res = await axios.get(`${directus_url}/items/feedbacks`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return json<LoaderData>({
      token,
      feedbacks: res.data.data || [],
    });
  } catch (error) {
    console.error("Failed to fetch feedbacks:", error);
    return redirect("/adminlogin");
  }
}


export default function Admin() {
    const { token, feedbacks: initialFeedbacks } = useLoaderData<LoaderData>();
    const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newFeedback, setNewFeedback] = useState({ title: "", description: "", category: "" });
    const navigate = useNavigate();
  
    const fetchFeedbacks = async () => {
      const res = await axios.get(`${directus_url}/items/feedbacks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks(res.data.data || []);
    };
  
    const handleStatusUpdate = async (id: number, status: string) => {
      await axios.patch(`${directus_url}/items/feedbacks/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchFeedbacks();
    };
  
    const handleDelete = async (id: number) => {
      await axios.delete(`${directus_url}/items/feedbacks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks(feedbacks.filter(fb => fb.id !== id));
    };
  
    const handleAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      const res = await axios.post(`${directus_url}/items/feedbacks`, newFeedback, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks([...feedbacks, res.data.data]);
      setNewFeedback({ title: "", description: "", category: "" });
      setShowAddForm(false);
    };
  
    const handleLogout = () => {
      document.cookie = `admin_token=; path=/admin; Max-Age=0`;
      document.cookie = `directus_token=; path=/admin; Max-Age=0`;
      navigate("/adminlogin");
    };
  
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="space-x-2">
            <button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-500 text-white px-4 py-2 rounded">
              {showAddForm ? "Cancel" : "Add Feedback"}
            </button>
            <button onClick={handleLogout} className="border border-red-500 text-red-500 px-4 py-2 rounded">
              Logout
            </button>
          </div>
        </div>
  
        {showAddForm && (
          <form onSubmit={handleAdd} className="space-y-4 mb-6">
            <input value={newFeedback.title} onChange={e => setNewFeedback({ ...newFeedback, title: e.target.value })}
              className="w-full p-2 border rounded" placeholder="Title" required />
            <textarea value={newFeedback.description}
              onChange={e => setNewFeedback({ ...newFeedback, description: e.target.value })}
              className="w-full p-2 border rounded" rows={4} placeholder="Description" required />
            <select value={newFeedback.category}
              onChange={e => setNewFeedback({ ...newFeedback, category: e.target.value })}
              className="w-full p-2 border rounded" required>
              <option value="">Select category</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="improvement">Improvement</option>
            </select>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Add</button>
          </form>
        )}
  
        <div className="space-y-4">
          {feedbacks.map(fb => (
            <div key={fb.id} className="border p-4 rounded">
              <div className="flex justify-between">
                <h3 className="font-semibold">{fb.title}</h3>
                <select
                  value={fb.status || "pending"}
                  onChange={e => handleStatusUpdate(fb.id, e.target.value)}
                  className="border px-2 py-1 text-sm rounded">
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <p>{fb.description}</p>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>{fb.category}</span>
                <button onClick={() => handleDelete(fb.id)} className="text-red-500">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  