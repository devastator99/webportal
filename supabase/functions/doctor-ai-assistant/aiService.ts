
export async function getAIResponse(formattedMessages: any[]) {
  console.log("Sending request to OpenAI API with", formattedMessages.length, "messages");
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using a more advanced model for better medical document analysis
        messages: formattedMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error response:", errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("OpenAI response received:", JSON.stringify(data.choices[0].message.content).substring(0, 100) + "...");
    return data;
  } catch (error) {
    console.error("Error in OpenAI request:", error);
    throw error;
  }
}
