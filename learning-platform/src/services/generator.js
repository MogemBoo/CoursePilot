
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const generateContent = async (topic, type) => {
    try {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic, type }),
        });

        if (!response.ok) {
            throw new Error('Generation failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Generator Error:', error);
        throw error;
    }
};
