import axios from 'axios';

export async function fetchAICompletion(prompt: string, isOnline: boolean, max_tokens = 1000): Promise<string>
{
  const API_URL = isOnline
    ? "http://<rtx-4050-server-ip>:8000/generate"
    : "http://127.0.0.1:8000/generate";

  try {
    const response = await axios.post(API_URL, { prompt, max_tokens });

    if (!response.data?.response) {
      throw new Error("Empty response from server");
    }

    return response.data.response.trim();
  } catch (error) {
    console.error("❌ API Error:", error);

    const errorMessage = isOnline
      ? "❌ Error: Failed to get response from the RTX server"
      : "❌ Error: Failed to get response from local AI backend";

    throw new Error(errorMessage);
  }
}