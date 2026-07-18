const generateImpactMessage = async (amount, campaign) => {
  try {
    const response = await fetch(`${process.env.GROK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [{
          role: 'user',
          content: `Generate a 1-2 sentence impact message for donating ₹${amount} to "${campaign.title}" (${campaign.category}). Be specific and inspiring.`
        }],
        max_tokens: 150,
        temperature: 0.8
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || `Your ₹${amount} contribution brings us closer to making a real difference!`;
  } catch {
    return `Your generous donation of ₹${amount} will directly support ${campaign.title} and help transform lives.`;
  }
};

module.exports = { generateImpactMessage };
