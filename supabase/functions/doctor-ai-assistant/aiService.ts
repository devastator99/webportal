
export async function getAIResponse(formattedMessages: any[]) {
  console.log("Sending request to OpenAI API with", formattedMessages.length, "messages");
  
  try {
    // Check if the messages array includes a care team chat prompt
    const isCareTeamChat = formattedMessages.some(msg => 
      msg.role === "system" && 
      msg.content.includes("care team chat")
    );
    
    // Adjust temperature based on context - slightly more creative in care team chats
    const temperature = isCareTeamChat ? 0.8 : 0.7;
    
    console.log(`Using ${isCareTeamChat ? 'care team' : 'standard'} response mode with temperature ${temperature}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using a more advanced model for better medical document analysis
        messages: formattedMessages,
        temperature: temperature,
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
